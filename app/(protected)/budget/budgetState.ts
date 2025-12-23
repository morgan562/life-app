export type AddTransactionState = {
  error: string | null;
  success: boolean;
};

export const addTransactionInitialState: AddTransactionState = {
  error: null,
  success: false,
};

export type ArchiveTransactionState = {
  error: string | null;
  success: boolean;
};

export const archiveTransactionInitialState: ArchiveTransactionState = {
  error: null,
  success: false,
};

export type RenameCategoryState = {
  error: string | null;
  success: boolean;
};

export const renameCategoryInitialState: RenameCategoryState = {
  error: null,
  success: false,
};

export type ArchiveCategoryState = {
  error: string | null;
  success: boolean;
};

export const archiveCategoryInitialState: ArchiveCategoryState = {
  error: null,
  success: false,
};

export type AddCategoryState = {
  error: string | null;
  success: boolean;
  newCategoryId: string | null;
};

export const addCategoryInitialState: AddCategoryState = {
  error: null,
  success: false,
  newCategoryId: null,
};

export type UpdateTransactionState = {
  error: string | null;
  success: boolean;
};

export const updateTransactionInitialState: UpdateTransactionState = {
  error: null,
  success: false,
};
