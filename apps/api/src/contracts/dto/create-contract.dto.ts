export class CreateContractDto {
  property_id: string;
  tenant_id: string;
  agent_id?: string;
  start_date: string; // ISO Date
  end_date: string; // ISO Date
  monthly_rent: number;
  deposit_amount?: number;
  status?: 'draft' | 'active' | 'ending' | 'closed' | 'terminated';
  terms?: Record<string, any>; // JSONB for specific terms
}
