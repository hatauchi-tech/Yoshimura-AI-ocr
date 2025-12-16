import { Template, FieldType } from './types';

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'tpl_order_form',
    name: '注文書',
    description: 'タイトルが「注文書」の帳票。発注元、納期、納品先名、品名／規格、ケース数、発注No.などが記載されている。',
    fields: [
      { key: 'order_no', label: '発注No.', type: FieldType.STRING, required: true, description: '発注No.、注文番号' },
      { key: 'order_date', label: '発注日', type: FieldType.STRING, required: true, description: '発注日、発行日 (yyyyMMdd形式)' },
      { key: 'buyer_name', label: '発注元', type: FieldType.STRING, required: true, description: '発注元の会社名' },
      { key: 'delivery_date', label: '納期', type: FieldType.STRING, required: true, description: '納期、希望納品日 (yyyyMMdd形式)' },
      { key: 'delivery_place', label: '納品先名', type: FieldType.STRING, required: true, description: '納品先の名称' },
      { 
        key: 'items', 
        label: '注文明細', 
        type: FieldType.TABLE, 
        required: true, 
        description: '品名／規格、ケース数などが記載された表',
        columns: [
          { key: 'product_name', label: '品名／規格', type: FieldType.STRING, required: true, description: '品名、規格' },
          { key: 'case_quantity', label: 'ケース数', type: FieldType.STRING, required: true, description: 'ケース数、数量' }
        ]
      }
    ]
  },
  {
    id: 'tpl_general_po',
    name: '発注書',
    description: 'タイトルが「発注書」の帳票。発注元、希望納品日、納品先、品名及び規格・仕様等、ケース、発注管理番号などが記載されている。',
    fields: [
      { key: 'po_no', label: '発注管理番号', type: FieldType.STRING, required: true, description: '発注管理番号、発注番号' },
      { key: 'issue_date', label: '発注日', type: FieldType.STRING, required: true, description: '発注日 (yyyyMMdd形式)' },
      { key: 'client_name', label: '発注元', type: FieldType.STRING, required: true, description: '発注元、得意先' },
      { key: 'delivery_date', label: '希望納品日', type: FieldType.STRING, required: true, description: '希望納品日 (yyyyMMdd形式)' },
      { key: 'delivery_place', label: '納品先', type: FieldType.STRING, required: true, description: '納品先' },
      { 
        key: 'items', 
        label: '発注明細', 
        type: FieldType.TABLE, 
        required: true, 
        description: '品名及び規格・仕様等、ケースなどが記載された表',
        columns: [
          { key: 'product_name', label: '品名及び規格・仕様等', type: FieldType.STRING, required: true, description: '品名' },
          { key: 'quantity', label: 'ケース', type: FieldType.STRING, required: true, description: 'ケース、数量' }
        ]
      }
    ]
  },
  {
    id: 'tpl_shipping_request',
    name: '出荷依頼書',
    description: 'タイトルが「出荷依頼書」の帳票。依頼元、納期、納品先、商品名称、個数／入数の上段（ケース）、受注No.などが記載されている。',
    fields: [
      { key: 'request_no', label: '受注No.', type: FieldType.STRING, required: true, description: '受注No.' },
      { key: 'order_date', label: '受注日', type: FieldType.STRING, required: true, description: '受注日 (yyyyMMdd形式)' },
      { key: 'sender_name', label: '依頼元', type: FieldType.STRING, required: true, description: '依頼元' },
      { key: 'delivery_date', label: '納期', type: FieldType.STRING, required: true, description: '納期、納品日 (yyyyMMdd形式)' },
      { key: 'recipient_name', label: '納品先', type: FieldType.STRING, required: true, description: '納品先' },
      { 
        key: 'items', 
        label: '商品明細', 
        type: FieldType.TABLE, 
        required: true, 
        description: '商品名称、個数／入数の上段（ケース）などが記載された表',
        columns: [
          { key: 'product_name', label: '商品名称', type: FieldType.STRING, required: true, description: '商品名称' },
          { key: 'case_quantity', label: '個数／入数の上段', type: FieldType.STRING, required: true, description: 'ケース数（入数の上段など）' }
        ]
      }
    ]
  },
  {
    id: 'tpl_purchase_order',
    name: '直送仕入商品発注票',
    description: 'タイトルが「直送仕入商品発注票」の帳票。得意先、摘要（希望納品日）、発送先、品目名称、発注箱数、発注No.などが記載されている。',
    fields: [
      { key: 'order_no', label: '発注No.', type: FieldType.STRING, required: true, description: '発注No.' },
      { key: 'issue_date', label: '発注日', type: FieldType.STRING, required: true, description: '発行日、発注日 (yyyyMMdd形式)' },
      { key: 'supplier_name', label: '得意先', type: FieldType.STRING, required: true, description: '得意先' },
      { key: 'delivery_date', label: '摘要', type: FieldType.STRING, required: true, description: '摘要欄にある日付（希望納品日） (yyyyMMdd形式)' },
      { key: 'delivery_name', label: '発送先', type: FieldType.STRING, required: true, description: '発送先名' },
      { 
        key: 'items', 
        label: '発注明細', 
        type: FieldType.TABLE, 
        required: true, 
        description: '品目名称、発注箱数などが記載された表',
        columns: [
          { key: 'item_name', label: '品目名称', type: FieldType.STRING, required: true, description: '品目名称' },
          { key: 'box_count', label: '発注箱数', type: FieldType.STRING, required: true, description: '発注箱数（ケース）' }
        ]
      }
    ]
  }
];

export const MODEL_OCR = 'gemini-3-pro-preview';