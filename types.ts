export enum FieldType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  TABLE = 'TABLE'
}

export interface TemplateField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  description: string;
  // For TABLE type
  columns?: TemplateField[]; 
}

export interface Template {
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
}

export interface ExtractedData {
  [key: string]: any; // Changed to any to support arrays of objects
}

export interface ProcessedDocument {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'review' | 'completed' | 'error';
  templateId?: string;
  data?: ExtractedData;
  error?: string;
}

export enum AppTab {
  DASHBOARD = 'DASHBOARD',
  INSTRUCTIONS = 'INSTRUCTIONS'
}

export enum ImageToolType {
  EDITOR = 'EDITOR',
  GENERATOR = 'GENERATOR'
}

export type ImageSize = '1K' | '2K' | '4K';