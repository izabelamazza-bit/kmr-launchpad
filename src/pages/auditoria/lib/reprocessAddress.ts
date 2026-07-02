import { supabase } from "@/integrations/supabase/client";
import { normAddress } from "./autoCompare";

const FLAG = "kmr:address-nok-reprocess:v1";

export async function reprocessAddressNok(): Promise<void> {
  try {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(FLAG)) return;

    const { data: items, error } = await supabase
      .from("audit_checklist_items")
      .select("id, contract_id")
      .eq("item_number", 6)
      .eq("status", "nok");
    if (error || !items?.length) {
      localStorage.setItem(FLAG, "1");
      return;
    }

    const contractIds = Array.from(new Set(items.map((i) => i.contract_id)));

    const [contractsRes, extractedRes] = await Promise.all([
      supabase.from("audit_contracts").select("id, endereco_imovel").in("id", contractIds),
      supabase.from("audit_contract_extracted_data").select("contract_id, endereco_imovel").in("contract_id", contractIds),
    ]);

    const contractAddr = new Map<string, string | null>(
      (contractsRes.data ?? []).map((c: any) => [c.id, c.endereco_imovel])
    );
    const extractedAddr = new Map<string, string | null>(
      (extractedRes.data ?? []).map((e: any) => [e.contract_id, e.endereco_imovel])
    );

    const toFix = items.filter((it) => {
      const a = contractAddr.get(it.contract_id);
      const b = extractedAddr.get(it.contract_id);
      if (!a || !b) return false;
      return normAddress(a) === normAddress(b);
    });

    if (toFix.length) {
      await Promise.all(
        toFix.map((it) =>
          supabase
            .from("audit_checklist_items")
            .update({ status: "ok", observation: null, verified_by_ai: true })
            .eq("id", it.id)
        )
      );
      console.log(`[reprocessAddressNok] corrigidos ${toFix.length} item(ns) 6`);
    }

    localStorage.setItem(FLAG, "1");
  } catch (e) {
    console.error("[reprocessAddressNok]", e);
  }
}