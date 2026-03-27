import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, queryKeys } from '../lib';

// ==================== ANNOUNCEMENTS HOOKS ====================

/**
 * Hook to get announcements list
 */
export function useAnnouncements(params = {}) {
  return useQuery({
    queryKey: queryKeys.announcements.list(params),
    queryFn: () => api.announcements.list(params).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get a single announcement
 */
export function useAnnouncement(id) {
  return useQuery({
    queryKey: queryKeys.announcements.detail(id),
    queryFn: () => api.announcements.get(id).then(res => res.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create an announcement
 */
export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.announcements.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
    },
  });
}

/**
 * Hook to update an announcement
 */
export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.announcements.update(id, data).then(res => res.data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
    },
  });
}

/**
 * Hook to like/unlike an announcement
 */
export function useToggleAnnouncementLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.announcements.like(id).then(res => res.data),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.detail(id) });
    },
  });
}

/**
 * Hook to get announcement comments
 */
export function useAnnouncementComments(id) {
  return useQuery({
    queryKey: queryKeys.announcements.comments(id),
    queryFn: () => api.announcements.getComments(id).then(res => res.data),
    enabled: !!id,
  });
}

/**
 * Hook to add a comment to an announcement
 */
export function useAddAnnouncementComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.announcements.addComment(id, data).then(res => res.data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.comments(id) });
    },
  });
}

// ==================== ANNOUNCEMENT DECKS HOOKS ====================

/**
 * Hook to get announcement decks
 */
export function useAnnouncementDecks() {
  return useQuery({
    queryKey: queryKeys.announcementDecks.all,
    queryFn: () => api.announcementDecks.list().then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get a single announcement deck
 */
export function useAnnouncementDeck(id) {
  return useQuery({
    queryKey: queryKeys.announcementDecks.detail(id),
    queryFn: () => api.announcementDecks.get(id).then(res => res.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create an announcement deck
 */
export function useCreateAnnouncementDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.announcementDecks.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcementDecks.all });
    },
  });
}

/**
 * Hook to get deck items
 */
export function useDeckItems(id) {
  return useQuery({
    queryKey: ['announcementDecks', id, 'items'],
    queryFn: () => api.announcementDecks.getItems(id).then(res => res.data),
    enabled: !!id,
  });
}

/**
 * Hook to set deck items
 */
export function useSetDeckItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, items }) => api.announcementDecks.setItems(id, { items }).then(res => res.data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['announcementDecks', id, 'items'] });
    },
  });
}

/**
 * Hook to generate deck PPTX
 */
export function useGenerateDeck() {
  return useMutation({
    mutationFn: (id) => api.announcementDecks.generate(id),
  });
}

/**
 * Hook to download deck PPTX
 */
export function useDownloadDeck() {
  return useMutation({
    mutationFn: (id) => api.announcementDecks.download(id),
  });
}

// ==================== DOCUMENTS HOOKS ====================

/**
 * Hook to get documents
 */
export function useDocuments() {
  return useQuery({
    queryKey: queryKeys.documents.all,
    queryFn: () => api.documents.list().then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a document
 */
export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.documents.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    },
  });
}

// ==================== CHURCH INFO HOOKS ====================

/**
 * Hook to get church biography
 */
export function useChurchBiography() {
  return useQuery({
    queryKey: queryKeys.church.biography,
    queryFn: () => api.church.getBiography().then(res => res.data),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to update church biography
 */
export function useUpdateChurchBiography() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.church.updateBiography(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.church.biography });
    },
  });
}

/**
 * Hook to get church consistory
 */
export function useChurchConsistory() {
  return useQuery({
    queryKey: queryKeys.church.consistory,
    queryFn: () => api.church.getConsistory().then(res => res.data),
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Hook to update church consistory
 */
export function useUpdateChurchConsistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.church.updateConsistory(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.church.consistory });
    },
  });
}

// ==================== LOGISTICS HOOKS ====================

/**
 * Hook to get logistics items
 */
export function useLogistics(params = {}) {
  return useQuery({
    queryKey: queryKeys.logistics.list?.(params) || ['logistics', params],
    queryFn: () => api.logistics.list(params).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a logistics item
 */
export function useCreateLogisticsItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.logistics.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.logistics.all });
    },
  });
}

/**
 * Hook to update a logistics item
 */
export function useUpdateLogisticsItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.logistics.update(id, data).then(res => res.data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.logistics.detail?.(id) || ['logistics', id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.logistics.all });
    },
  });
}
