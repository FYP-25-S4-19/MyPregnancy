import { ProductCategory, ProductPreviewPaginatedResponse } from "../typesAndInterfaces";
import { useQuery } from "@tanstack/react-query";
import api from "../api";

export const useProductCategories = () => {
  return useQuery({
    queryKey: ["Product Categories"],
    queryFn: async () => {
      const response = await api.get<ProductCategory[]>(`/products/categories/`);
      return response.data;
    },
  });
};

export const useProductPreviews = (limit: number = 6) => {
  return useQuery({
    queryKey: ["Product Previews", limit],
    queryFn: async ({ pageParam }) => {
      const cursorParam = pageParam ? `&cursor=${pageParam}` : "";
      const response = await api.get<ProductPreviewPaginatedResponse>(
        `/products/previews?limit=${limit}${cursorParam}`,
      );
      return response.data;
    },
    getNextPageParam: (lastPage: ProductPreviewPaginatedResponse) => {
      return lastPage.has_more ? lastPage.next_cursor : undefined;
    },
  });
};
