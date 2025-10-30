export interface TableRow {
  id: number;
  displayId: number;
  brand: string;
  style: string;
  description: string;
  from: string;
  to: string;
  note: string;
  customNote?: string;
}

export interface ProcessedRequest {
    id: number;
    displayId: number;
    brand: string;
    style: string;
    description: string;
    sender: string;
    receiver: string;
    note: string;
}
