export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agent_config: {
        Row: {
          allowed_actions: Json
          created_at: string
          greeting_message: string
          id: string
          is_active: boolean
          knowledge_base: Json
          max_response_length: number
          model: string
          personality: string
          restricted_topics: Json
          system_prompt: string
          updated_at: string
        }
        Insert: {
          allowed_actions?: Json
          created_at?: string
          greeting_message?: string
          id?: string
          is_active?: boolean
          knowledge_base?: Json
          max_response_length?: number
          model?: string
          personality?: string
          restricted_topics?: Json
          system_prompt?: string
          updated_at?: string
        }
        Update: {
          allowed_actions?: Json
          created_at?: string
          greeting_message?: string
          id?: string
          is_active?: boolean
          knowledge_base?: Json
          max_response_length?: number
          model?: string
          personality?: string
          restricted_topics?: Json
          system_prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_checklist_items: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          item_label: string
          item_number: number
          observation: string | null
          section: string
          status: string
          updated_at: string
          updated_by: string | null
          verified_by_ai: boolean
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          item_label: string
          item_number: number
          observation?: string | null
          section: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          verified_by_ai?: boolean
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          item_label?: string
          item_number?: number
          observation?: string | null
          section?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          verified_by_ai?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "audit_checklist_items_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "audit_contract_progress"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "audit_checklist_items_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "audit_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_contract_extracted_data: {
        Row: {
          assinatura_digital: boolean | null
          clausula_garantia_trecho: string | null
          contract_id: string
          cpf_locatarios: string | null
          data_inicio: string | null
          data_termino: string | null
          dia_vencimento: number | null
          endereco_imovel: string | null
          extracted_at: string
          garantidora_identificada_raw: string | null
          garantidora_normalizada: string | null
          id: string
          indice_reajuste: string | null
          locadores: string | null
          locatarios: string | null
          observacoes_extracao: string | null
          pdf_url: string | null
          prazo_meses: number | null
          updated_at: string
          valor_aluguel: number | null
        }
        Insert: {
          assinatura_digital?: boolean | null
          clausula_garantia_trecho?: string | null
          contract_id: string
          cpf_locatarios?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          dia_vencimento?: number | null
          endereco_imovel?: string | null
          extracted_at?: string
          garantidora_identificada_raw?: string | null
          garantidora_normalizada?: string | null
          id?: string
          indice_reajuste?: string | null
          locadores?: string | null
          locatarios?: string | null
          observacoes_extracao?: string | null
          pdf_url?: string | null
          prazo_meses?: number | null
          updated_at?: string
          valor_aluguel?: number | null
        }
        Update: {
          assinatura_digital?: boolean | null
          clausula_garantia_trecho?: string | null
          contract_id?: string
          cpf_locatarios?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          dia_vencimento?: number | null
          endereco_imovel?: string | null
          extracted_at?: string
          garantidora_identificada_raw?: string | null
          garantidora_normalizada?: string | null
          id?: string
          indice_reajuste?: string | null
          locadores?: string | null
          locatarios?: string | null
          observacoes_extracao?: string | null
          pdf_url?: string | null
          prazo_meses?: number | null
          updated_at?: string
          valor_aluguel?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_contract_extracted_data_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "audit_contract_progress"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "audit_contract_extracted_data_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "audit_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_contracts: {
        Row: {
          analyst_id: string | null
          analyst_name: string | null
          audit_status: string
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string | null
          data_proximo_reajuste: string | null
          empresa: string | null
          endereco_imovel: string | null
          garantidora: string | null
          general_notes: string | null
          id: string
          imoview_number: string
          import_batch_id: string | null
          indice_reajuste: string | null
          locador_cpf: string | null
          locador_nome: string | null
          locatario_cpf: string | null
          locatario_nome: string | null
          ocupacao: string | null
          status_contrato: string | null
          updated_at: string
          valor_aluguel: number | null
        }
        Insert: {
          analyst_id?: string | null
          analyst_name?: string | null
          audit_status?: string
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          data_proximo_reajuste?: string | null
          empresa?: string | null
          endereco_imovel?: string | null
          garantidora?: string | null
          general_notes?: string | null
          id?: string
          imoview_number: string
          import_batch_id?: string | null
          indice_reajuste?: string | null
          locador_cpf?: string | null
          locador_nome?: string | null
          locatario_cpf?: string | null
          locatario_nome?: string | null
          ocupacao?: string | null
          status_contrato?: string | null
          updated_at?: string
          valor_aluguel?: number | null
        }
        Update: {
          analyst_id?: string | null
          analyst_name?: string | null
          audit_status?: string
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          data_proximo_reajuste?: string | null
          empresa?: string | null
          endereco_imovel?: string | null
          garantidora?: string | null
          general_notes?: string | null
          id?: string
          imoview_number?: string
          import_batch_id?: string | null
          indice_reajuste?: string | null
          locador_cpf?: string | null
          locador_nome?: string | null
          locatario_cpf?: string | null
          locatario_nome?: string | null
          ocupacao?: string | null
          status_contrato?: string | null
          updated_at?: string
          valor_aluguel?: number | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string
          complemento: string | null
          created_at: string
          email: string
          estado: string | null
          id: string
          logradouro: string | null
          nome_fantasia: string
          numero: string | null
          phone: string | null
          razao_social: string
          status: string
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj: string
          complemento?: string | null
          created_at?: string
          email: string
          estado?: string | null
          id?: string
          logradouro?: string | null
          nome_fantasia: string
          numero?: string | null
          phone?: string | null
          razao_social: string
          status?: string
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string
          complemento?: string | null
          created_at?: string
          email?: string
          estado?: string | null
          id?: string
          logradouro?: string | null
          nome_fantasia?: string
          numero?: string | null
          phone?: string | null
          razao_social?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contratos_pessoas: {
        Row: {
          aviso_desocupacao: boolean
          codigo: string
          created_at: string
          data_aviso_desocupacao: string | null
          data_fim: string
          data_inicio: string
          dia_vencimento: number
          email: string
          endereco: string
          id: string
          nome: string
          proximo_reajuste: string
          situacao: string
          telefone1: string
          telefone2: string | null
          updated_at: string
          valor_aluguel: number
        }
        Insert: {
          aviso_desocupacao?: boolean
          codigo: string
          created_at?: string
          data_aviso_desocupacao?: string | null
          data_fim: string
          data_inicio: string
          dia_vencimento?: number
          email: string
          endereco: string
          id?: string
          nome: string
          proximo_reajuste: string
          situacao?: string
          telefone1: string
          telefone2?: string | null
          updated_at?: string
          valor_aluguel?: number
        }
        Update: {
          aviso_desocupacao?: boolean
          codigo?: string
          created_at?: string
          data_aviso_desocupacao?: string | null
          data_fim?: string
          data_inicio?: string
          dia_vencimento?: number
          email?: string
          endereco?: string
          id?: string
          nome?: string
          proximo_reajuste?: string
          situacao?: string
          telefone1?: string
          telefone2?: string | null
          updated_at?: string
          valor_aluguel?: number
        }
        Relationships: []
      }
      ideali_contracts: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          codigo_contrato: string
          codigo_legado: string | null
          complemento: string | null
          created_at: string
          data_finalizacao_contrato: string | null
          data_inicio_contrato: string | null
          data_proximo_reajuste: string | null
          data_ultimo_reajuste: string | null
          desconto_pontualidade: number | null
          despesa_bancaria: number | null
          dia_vencimento: number | null
          documento_inquilino: string | null
          documento_proprietario: string | null
          emails_inquilino: string | null
          emails_proprietario: string | null
          empresa: string
          finalidade_contrato: string | null
          garantidora: string | null
          gerar_notas_fiscais: boolean | null
          id: string
          juros_atraso_dia: number | null
          meses_duracao_contrato: number | null
          multa_atraso: number | null
          nome_indice: string | null
          nome_inquilino: string | null
          nome_proprietario: string | null
          numero: string | null
          pontualizado: string | null
          produto: string | null
          repasse_proprietario_percentual: number | null
          rua: string | null
          status: string
          taxa_admin: number | null
          taxa_admin_minima: number | null
          taxa_admin_parc_up: number | null
          taxa_boleto: number | null
          taxa_ted: number | null
          telefone_inquilino: string | null
          telefone_proprietario: string | null
          tipo_garantia: string | null
          updated_at: string
          valor_aluguel: number | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          codigo_contrato: string
          codigo_legado?: string | null
          complemento?: string | null
          created_at?: string
          data_finalizacao_contrato?: string | null
          data_inicio_contrato?: string | null
          data_proximo_reajuste?: string | null
          data_ultimo_reajuste?: string | null
          desconto_pontualidade?: number | null
          despesa_bancaria?: number | null
          dia_vencimento?: number | null
          documento_inquilino?: string | null
          documento_proprietario?: string | null
          emails_inquilino?: string | null
          emails_proprietario?: string | null
          empresa?: string
          finalidade_contrato?: string | null
          garantidora?: string | null
          gerar_notas_fiscais?: boolean | null
          id?: string
          juros_atraso_dia?: number | null
          meses_duracao_contrato?: number | null
          multa_atraso?: number | null
          nome_indice?: string | null
          nome_inquilino?: string | null
          nome_proprietario?: string | null
          numero?: string | null
          pontualizado?: string | null
          produto?: string | null
          repasse_proprietario_percentual?: number | null
          rua?: string | null
          status: string
          taxa_admin?: number | null
          taxa_admin_minima?: number | null
          taxa_admin_parc_up?: number | null
          taxa_boleto?: number | null
          taxa_ted?: number | null
          telefone_inquilino?: string | null
          telefone_proprietario?: string | null
          tipo_garantia?: string | null
          updated_at?: string
          valor_aluguel?: number | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          codigo_contrato?: string
          codigo_legado?: string | null
          complemento?: string | null
          created_at?: string
          data_finalizacao_contrato?: string | null
          data_inicio_contrato?: string | null
          data_proximo_reajuste?: string | null
          data_ultimo_reajuste?: string | null
          desconto_pontualidade?: number | null
          despesa_bancaria?: number | null
          dia_vencimento?: number | null
          documento_inquilino?: string | null
          documento_proprietario?: string | null
          emails_inquilino?: string | null
          emails_proprietario?: string | null
          empresa?: string
          finalidade_contrato?: string | null
          garantidora?: string | null
          gerar_notas_fiscais?: boolean | null
          id?: string
          juros_atraso_dia?: number | null
          meses_duracao_contrato?: number | null
          multa_atraso?: number | null
          nome_indice?: string | null
          nome_inquilino?: string | null
          nome_proprietario?: string | null
          numero?: string | null
          pontualizado?: string | null
          produto?: string | null
          repasse_proprietario_percentual?: number | null
          rua?: string | null
          status?: string
          taxa_admin?: number | null
          taxa_admin_minima?: number | null
          taxa_admin_parc_up?: number | null
          taxa_boleto?: number | null
          taxa_ted?: number | null
          telefone_inquilino?: string | null
          telefone_proprietario?: string | null
          tipo_garantia?: string | null
          updated_at?: string
          valor_aluguel?: number | null
        }
        Relationships: []
      }
      ideali_documentos: {
        Row: {
          apolice_garantia: boolean
          apolice_seguro_incendio: boolean
          codigo_contrato: string
          contrato_adm: boolean
          contrato_locacao: boolean
          created_at: string
          endereco: string | null
          garantidora: string | null
          id: string
          inquilino: string | null
          levantamento_documentos: boolean
          migrar: string | null
          n_arquivos_drive: number
          nome_pasta_drive: string | null
          observacoes: string | null
          pasta_encontrada_drive: boolean
          prioritario: boolean
          relatorio_repasse_cobranca: boolean
          status_contrato: string | null
          status_documento_drive: string
          tem_doc_garantia_drive: boolean
          updated_at: string
          vistoria: boolean
        }
        Insert: {
          apolice_garantia?: boolean
          apolice_seguro_incendio?: boolean
          codigo_contrato: string
          contrato_adm?: boolean
          contrato_locacao?: boolean
          created_at?: string
          endereco?: string | null
          garantidora?: string | null
          id?: string
          inquilino?: string | null
          levantamento_documentos?: boolean
          migrar?: string | null
          n_arquivos_drive?: number
          nome_pasta_drive?: string | null
          observacoes?: string | null
          pasta_encontrada_drive?: boolean
          prioritario?: boolean
          relatorio_repasse_cobranca?: boolean
          status_contrato?: string | null
          status_documento_drive?: string
          tem_doc_garantia_drive?: boolean
          updated_at?: string
          vistoria?: boolean
        }
        Update: {
          apolice_garantia?: boolean
          apolice_seguro_incendio?: boolean
          codigo_contrato?: string
          contrato_adm?: boolean
          contrato_locacao?: boolean
          created_at?: string
          endereco?: string | null
          garantidora?: string | null
          id?: string
          inquilino?: string | null
          levantamento_documentos?: boolean
          migrar?: string | null
          n_arquivos_drive?: number
          nome_pasta_drive?: string | null
          observacoes?: string | null
          pasta_encontrada_drive?: boolean
          prioritario?: boolean
          relatorio_repasse_cobranca?: boolean
          status_contrato?: string | null
          status_documento_drive?: string
          tem_doc_garantia_drive?: boolean
          updated_at?: string
          vistoria?: boolean
        }
        Relationships: []
      }
      ideali_fila_analista: {
        Row: {
          clausula_garantidora_presente: string
          codigo_contrato: string
          created_at: string
          endereco: string | null
          endereco_confere: string
          garantidora: string | null
          id: string
          inquilino: string | null
          localizacao_documento: string
          nome_inquilino_confere: string
          observacoes: string | null
          ordem: number
          resolvido_em: string | null
          status_contrato: string | null
          status_documento_drive: string
          status_fila: string
          status_loft_seguradora: string
          updated_at: string
        }
        Insert: {
          clausula_garantidora_presente?: string
          codigo_contrato: string
          created_at?: string
          endereco?: string | null
          endereco_confere?: string
          garantidora?: string | null
          id?: string
          inquilino?: string | null
          localizacao_documento?: string
          nome_inquilino_confere?: string
          observacoes?: string | null
          ordem?: number
          resolvido_em?: string | null
          status_contrato?: string | null
          status_documento_drive?: string
          status_fila?: string
          status_loft_seguradora?: string
          updated_at?: string
        }
        Update: {
          clausula_garantidora_presente?: string
          codigo_contrato?: string
          created_at?: string
          endereco?: string | null
          endereco_confere?: string
          garantidora?: string | null
          id?: string
          inquilino?: string | null
          localizacao_documento?: string
          nome_inquilino_confere?: string
          observacoes?: string | null
          ordem?: number
          resolvido_em?: string | null
          status_contrato?: string | null
          status_documento_drive?: string
          status_fila?: string
          status_loft_seguradora?: string
          updated_at?: string
        }
        Relationships: []
      }
      ideali_invoices: {
        Row: {
          adicional_fatura: string | null
          codigo_contrato: string
          created_at: string
          dado_incompleto: boolean
          data_repasse_fatura: string | null
          id: string
          id_fatura_origem: number
          pagamento_fatura: string | null
          status_fatura: string
          status_repasse_fatura: string | null
          valor_boleto: number | null
          valor_pago_fatura: number | null
          vencimento_fatura: string
        }
        Insert: {
          adicional_fatura?: string | null
          codigo_contrato: string
          created_at?: string
          dado_incompleto?: boolean
          data_repasse_fatura?: string | null
          id?: string
          id_fatura_origem: number
          pagamento_fatura?: string | null
          status_fatura: string
          status_repasse_fatura?: string | null
          valor_boleto?: number | null
          valor_pago_fatura?: number | null
          vencimento_fatura: string
        }
        Update: {
          adicional_fatura?: string | null
          codigo_contrato?: string
          created_at?: string
          dado_incompleto?: boolean
          data_repasse_fatura?: string | null
          id?: string
          id_fatura_origem?: number
          pagamento_fatura?: string | null
          status_fatura?: string
          status_repasse_fatura?: string | null
          valor_boleto?: number | null
          valor_pago_fatura?: number | null
          vencimento_fatura?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideali_invoices_codigo_contrato_fkey"
            columns: ["codigo_contrato"]
            isOneToOne: false
            referencedRelation: "ideali_contracts"
            referencedColumns: ["codigo_contrato"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          channel_status: string
          company: string | null
          conversation_history: Json | null
          created_at: string
          email: string | null
          id: string
          interest: string | null
          name: string | null
          phone: string | null
          qualification_notes: string | null
          scheduled_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          channel_status?: string
          company?: string | null
          conversation_history?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          interest?: string | null
          name?: string | null
          phone?: string | null
          qualification_notes?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          channel_status?: string
          company?: string | null
          conversation_history?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          interest?: string | null
          name?: string | null
          phone?: string | null
          qualification_notes?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          bairro: string | null
          birth_date: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf: string
          created_at: string
          email: string
          estado: string | null
          full_name: string
          id: string
          logradouro: string | null
          numero: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          birth_date?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf: string
          created_at?: string
          email: string
          estado?: string | null
          full_name: string
          id?: string
          logradouro?: string | null
          numero?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          birth_date?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string
          created_at?: string
          email?: string
          estado?: string | null
          full_name?: string
          id?: string
          logradouro?: string | null
          numero?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      products_services: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price?: number
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      sinistro_anexos: {
        Row: {
          created_at: string
          file_path: string
          id: string
          nome: string
          sinistro_id: string
          tipo: string | null
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          nome: string
          sinistro_id: string
          tipo?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          nome?: string
          sinistro_id?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sinistro_anexos_sinistro_id_fkey"
            columns: ["sinistro_id"]
            isOneToOne: false
            referencedRelation: "sinistros"
            referencedColumns: ["id"]
          },
        ]
      }
      sinistro_debitos: {
        Row: {
          boleto_path: string | null
          created_at: string
          data_vencimento: string
          descricao: string | null
          id: string
          sinistro_id: string
          tipo: string
          valor: number
        }
        Insert: {
          boleto_path?: string | null
          created_at?: string
          data_vencimento: string
          descricao?: string | null
          id?: string
          sinistro_id: string
          tipo: string
          valor?: number
        }
        Update: {
          boleto_path?: string | null
          created_at?: string
          data_vencimento?: string
          descricao?: string | null
          id?: string
          sinistro_id?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "sinistro_debitos_sinistro_id_fkey"
            columns: ["sinistro_id"]
            isOneToOne: false
            referencedRelation: "sinistros"
            referencedColumns: ["id"]
          },
        ]
      }
      sinistro_historico: {
        Row: {
          created_at: string
          id: string
          sinistro_id: string
          texto: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          sinistro_id: string
          texto: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          sinistro_id?: string
          texto?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      sinistros: {
        Row: {
          checklist: Json
          codigo_contrato: string
          created_at: string
          created_by: string | null
          data_entrega_chaves: string | null
          id: string
          inquilino_cpf: string
          inquilino_nome: string
          motivo_desocupacao: string | null
          observacoes: string | null
          possui_obras: boolean
          status: string
          status_imovel: string
          updated_at: string
        }
        Insert: {
          checklist?: Json
          codigo_contrato: string
          created_at?: string
          created_by?: string | null
          data_entrega_chaves?: string | null
          id?: string
          inquilino_cpf: string
          inquilino_nome: string
          motivo_desocupacao?: string | null
          observacoes?: string | null
          possui_obras?: boolean
          status?: string
          status_imovel: string
          updated_at?: string
        }
        Update: {
          checklist?: Json
          codigo_contrato?: string
          created_at?: string
          created_by?: string | null
          data_entrega_chaves?: string | null
          id?: string
          inquilino_cpf?: string
          inquilino_nome?: string
          motivo_desocupacao?: string | null
          observacoes?: string | null
          possui_obras?: boolean
          status?: string
          status_imovel?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users_registry: {
        Row: {
          access_profile: string
          created_at: string
          email: string
          full_name: string
          id: string
          must_change_password: boolean
          phone: string | null
          status: string
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          access_profile?: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          must_change_password?: boolean
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          access_profile?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          must_change_password?: boolean
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      audit_contract_progress: {
        Row: {
          contract_id: string | null
          has_critical_nok: boolean | null
          nok_items: number | null
          ok_items: number | null
          total_items: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      clear_must_change_password: { Args: never; Returns: undefined }
      ensure_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_supervisor_or_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "supervisor" | "analista"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "supervisor", "analista"],
    },
  },
} as const
