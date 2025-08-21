import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { type Observable } from 'rxjs';
import { PageableParams } from 'pageable.model';
import { ConfigService } from 'shared/config.service';

export interface TransactionDto {
	id: string;
	fromOprAddress: string;
	fromTrxAddress: string;
	toOprAddress: unknown;
	toTrxAddress: string;
	customerId: string;
	receiverCustomerId: unknown;
	institutionId: number;
	amount: string;
	amountInSenderCurrency: string;
	creditAmount: string;
	debitAmount: string;
	totalCommissionAmount: string;
	exchangeCommissionAmount: string;
	transactionCommissionAmount: string;
	maxSlippage: unknown;
	slippageCommissionAmount: unknown;
	currencyFrom: string;
	currencyTo: string;
	exchangeRate: number;
	requestedRate: unknown;
	transactionId: number;
	transactionFee: unknown;
	gasPrice: unknown;
	transactionHash: string;
	trxStatus: string;
	statusDescription: unknown;
	cryptocurrency: string;
	oprStatus: 'REJECTED' | 'CONFIRMED' | 'REFUNDED';
	type: 'IN' | 'OUT' | 'CST_C2F' | 'CST_F2C' | 'CST_C2C' | 'CSTD_OUT' | 'CSTD_IN' | 'WITHIN';
	category: string;
	commissionIsTransferred: unknown;
	provider: unknown;
	amountDirection: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateTransactionDto {
	cryptocurrency: string;
	amount: number;
	fromTrxAddress: string;
	toTrxAddress: string;
}

// interface CreateTransactionResponse {
// 	id: string;
// 	cryptocurrency: string;
// 	amount: number;
// 	fromTrxAddress: string;
// 	toTrxAddress: string;
// }

export interface TransactionPageableParams extends PageableParams {
	transactionHash?: string;
	dateFrom?: string;
	dateTo?: string;
	cryptocurrency?: string;
	statuses?: string;
	trxAddress?: string;
}

export interface TransactionPageableResponse {
	data: TransactionDto[];
	limit: number;
	page: number;
	total: number;
}

@Injectable({
	providedIn: 'root',
})
export class TransactionsService {
	private httpClient = inject(HttpClient);
	private configService = inject(ConfigService);

	getTransactions(params: TransactionPageableParams): Observable<TransactionPageableResponse> {
		return this.httpClient.get<TransactionPageableResponse>(
			`${this.configService.serverUrl}/v1/bff-custody/transactions`,
			{
				params: params as HttpParams,
			},
		);
	}

	// TODO fix to use id
	// getSingleTransaction(id: string): Observable<TransactionDto> {
	// 	return this.httpClient
	// 		.get<TransactionPageableResponse>(`${this.configService.serverUrl}/v1/bff-custody/transactions`)
	// 		.pipe(map((transactions) => transactions.data[0]));
	// }

	// makeTransaction(info: CreateTransactionDto): Observable<CreateTransactionResponse> {
	// 	const userId = this.userService.currentUser$.value?.id;
	// 	if (!userId) {
	// 		throw new Error('no current user');
	// 	}
	//
	// 	return this.httpClient.post<CreateTransactionResponse>(
	// 		`${this.configService.serverUrl}/v1/bff-custody/transactions`,
	// 		info,
	// 		{
	// 			headers: {
	// 				'Customer-ID': environment.customerId,
	// 				'User-ID': userId?.toString() ?? '',
	// 			},
	// 		},
	// 	);
	// }
	//
	// confirmTransaction(id: string): Observable<void> {
	// 	const userId = this.userService.currentUser$.value?.id;
	// 	if (!userId) {
	// 		throw new Error('no current user');
	// 	}
	//
	// 	return this.httpClient.post<void>(
	// 		`${this.configService.serverUrl}/v1/bff-custody/transactions/confirm/${id}`,
	// 		{},
	// 		{
	// 			headers: {
	// 				'Customer-ID': environment.customerId,
	// 				'User-ID': userId?.toString() ?? '',
	// 			},
	// 		},
	// 	);
	// }
	//
	// deleteTransaction(id: string): Observable<void> {
	// 	const userId = this.userService.currentUser$.value?.id;
	// 	if (!userId) {
	// 		throw new Error('no current user');
	// 	}
	//
	// 	return this.httpClient.delete<void>(`${this.configService.serverUrl}/v1/bff-custody/transactions/remove/${id}`, {
	// 		headers: {
	// 			'Customer-ID': environment.customerId,
	// 			'User-ID': userId?.toString() ?? '',
	// 		},
	// 	});
	// }
}
