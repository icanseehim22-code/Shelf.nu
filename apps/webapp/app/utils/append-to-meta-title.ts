/** Small helper that appends `estoquesoftsystem.com` to the current route meta title */
export const appendToMetaTitle = (title: string | null | undefined) =>
  `${title ? title : "Not found"} | estoquesoftsystem.com`;
