import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, queryKeys } from '../lib';

// ==================== FINANCIAL CATEGORIES HOOKS ====================

/**
 * Hook to get all financial categories
 */
export function useFinancialCategories() {
  return useQuery({
    queryKey: queryKeys.finance.categories,
    queryFn: () => api.finance.categories.list().then(res => res.data),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to create a financial category
 */
export function useCreateFinancialCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.finance.categories.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.categories });
    },
  });
}

/**
 * Hook to update a financial category
 */
export function useUpdateFinancialCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => 
      api.finance.categories.update(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.categories });
    },
  });
}

// ==================== FINANCIAL TRANSACTIONS HOOKS ====================

/**
 * Hook to get financial transactions with filtering
 */
export function useFinancialTransactions(params = {}) {
  return useQuery({
    queryKey: queryKeys.finance.list(params),
    queryFn: () => api.finance.transactions.list(params).then(res => res.data),
    staleTime: 1 * 60 * 1000, // 1 minute - financial data changes frequently
  });
}

/**
 * Hook to get a single financial transaction
 */
export function useFinancialTransaction(id) {
  return useQuery({
    queryKey: ['finance', 'transactions', id],
    queryFn: () => api.finance.transactions.get(id).then(res => res.data),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook to create a financial transaction
 */
export function useCreateFinancialTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.finance.transactions.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.transactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.summary });
    },
  });
}

/**
 * Hook to update a financial transaction
 */
export function useUpdateFinancialTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => 
      api.finance.transactions.update(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.transactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.summary });
    },
  });
}

/**
 * Hook to get financial summary
 */
export function useFinancialSummary() {
  return useQuery({
    queryKey: queryKeys.finance.summary,
    queryFn: () => api.finance.transactions.summary().then(res => res.data),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get financial time series data
 */
export function useFinancialTimeSeries(params = {}) {
  return useQuery({
    queryKey: queryKeys.finance.timeSeries(params),
    queryFn: () => api.finance.transactions.timeSeries(params).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to export financial transactions
 */
export function useExportFinancialTransactions() {
  return useMutation({
    mutationFn: (params) => api.finance.transactions.export(params),
  });
}

/**
 * Hook to verify a receipt by code
 */
export function useVerifyReceipt() {
  return useMutation({
    mutationFn: (code) => api.finance.transactions.verifyReceipt(code).then(res => res.data),
  });
}

/**
 * Hook to verify a document by code
 */
export function useVerifyDocument() {
  return useMutation({
    mutationFn: (code) => api.finance.transactions.verifyDocument(code).then(res => res.data),
  });
}

/**
 * Hook to get transaction receipt PDF
 */
export function useTransactionReceipt() {
  return useMutation({
    mutationFn: (id) => api.finance.transactions.getReceipt(id),
  });
}

/**
 * Hook to get transaction voucher PDF
 */
export function useTransactionVoucher() {
  return useMutation({
    mutationFn: (id) => api.finance.transactions.getVoucher(id),
  });
}

/**
 * Hook to generate financial report PDF
 */
export function useFinancialReportPdf() {
  return useMutation({
    mutationFn: (params) => api.finance.transactions.reportPdf(params),
  });
}
