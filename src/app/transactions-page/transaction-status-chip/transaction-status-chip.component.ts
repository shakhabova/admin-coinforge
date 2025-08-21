import { Component, computed, input } from '@angular/core';
import { TransactionDto } from 'transactions-page/transactions.service';

const STATUSES_MAP: Record<string, string> = {
	CONFIRMED: 'Confirmed',
	REFUNDED: 'Refunded',
	REJECTED: 'Rejected',
	AML_PENDING: 'Pending',
	AML_REJECTED: 'Rejected',
	AML_ACCEPTED: 'Accepted',
	TECH_PROCESSING: 'Pending',
	WAITED_RATE: 'Processing',
	NB_BEN_PENDING: 'Pending',
	NB_REJECTED: 'Rejected',
	NB_ACCEPTED: 'Accepted'

};

@Component({
	selector: 'app-transaction-status-chip',
	imports: [],
	templateUrl: './transaction-status-chip.component.html',
	styleUrl: './transaction-status-chip.component.css',
})
export class TransactionStatusChipComponent {
	status = input.required<TransactionDto['oprStatus']>();

	statusLabel = computed(() => STATUSES_MAP[this.status()] || this.status());
}
