import { Template, FieldType } from './types';

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'tpl_shipping_request',
    name: '出荷依頼書',
    description: '「出荷依頼書」というタイトルの帳票。依頼主、納品先、および商品明細が含まれる。',
    fields: [
      { key: 'request_no', label: '受注No.', type: FieldType.STRING, required: true, description: '右上の受注No' },
      { key: 'order_date', label: '受注日', type: FieldType.DATE, required: true, description: '右上の受注日' },
      { key: 'delivery_date', label: '納期', type: FieldType.DATE, required: true, description: '右上の納期' },
      { key: 'sender_name', label: '依頼元', type: FieldType.STRING, required: true, description: '依頼元の会社名（株式会社シンギなど）' },
      { key: 'recipient_name', label: '納品先名', type: FieldType.STRING, required: true, description: '【納品先】の下にある会社名' },
      { key: 'recipient_address', label: '納品先住所', type: FieldType.STRING, required: true, description: '納品先の住所' },
      { key: 'recipient_tel', label: '納品先TEL', type: FieldType.STRING, required: false, description: '納品先の電話番号' },
      { 
        key: 'items', 
        label: '商品明細', 
        type: FieldType.TABLE, 
        required: true, 
        description: '商品コード、商品名称、個数、数量などが記載された表',
        columns: [
          { key: 'product_code', label: '商品コード', type: FieldType.STRING, required: true, description: '商品コード' },
          { key: 'product_name', label: '商品名称', type: FieldType.STRING, required: true, description: '商品名' },
          { key: 'case_quantity', label: 'ケース数', type: FieldType.NUMBER, required: false, description: '個数/入数の上段' },
          { key: 'total_quantity', label: '総数量', type: FieldType.NUMBER, required: true, description: '数量' },
          { key: 'unit', label: '単位', type: FieldType.STRING, required: false, description: '単位 (C/Sなど)' }
        ]
      }
    ]
  },
  {
    id: 'tpl_purchase_order',
    name: '直送仕入商品発注票',
    description: '「直送仕入商品発注票」というタイトルの帳票。発注先、配送先、明細が含まれる。',
    fields: [
      { key: 'order_no', label: '発注No.', type: FieldType.STRING, required: true, description: '左上の発注No' },
      { key: 'issue_date', label: '発行日', type: FieldType.DATE, required: true, description: '右上の日付' },
      { key: 'supplier_name', label: '発注先', type: FieldType.STRING, required: true, description: '左上の発注先会社名' },
      { key: 'delivery_name', label: '発送先名', type: FieldType.STRING, required: true, description: '発送先の名称' },
      { key: 'delivery_address', label: '発送先住所', type: FieldType.STRING, required: true, description: '発送先の住所' },
      { key: 'delivery_date', label: '出荷指定日', type: FieldType.DATE, required: true, description: '出荷指定日' },
      { 
        key: 'items', 
        label: '発注明細', 
        type: FieldType.TABLE, 
        required: true, 
        description: '品番、品名、数量などが記載された表',
        columns: [
          { key: 'line_no', label: '行', type: FieldType.NUMBER, required: false, description: '行番号' },
          { key: 'item_code', label: '品目No', type: FieldType.STRING, required: true, description: '品目No' },
          { key: 'item_name', label: '品目名称', type: FieldType.STRING, required: true, description: '品目名称' },
          { key: 'quantity', label: '数量', type: FieldType.NUMBER, required: true, description: '数量' },
          { key: 'quantity_per_case', label: '入り数', type: FieldType.NUMBER, required: false, description: '入り数' },
          { key: 'box_count', label: '発注箱数', type: FieldType.NUMBER, required: false, description: '発注箱数' }
        ]
      }
    ]
  }
];

export const MODEL_OCR = 'gemini-3-pro-preview';
