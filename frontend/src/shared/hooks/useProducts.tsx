import {
  ProductCategory,
  ProductPreviewPaginatedResponse,
  ProductDetailedResponse,
  ProductMutationData,
} from "../typesAndInterfaces";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export const useAddNewProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProductMutationData) => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("category", data.category);
      formData.append("price_cents", data.price_cents.toString());
      formData.append("description", data.description);

      // Append the image file
      formData.append("img_file", data.img_file);
      const response = await api.post("/products/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-products"] });
    },
    onError: (error) => {
      console.error("Failed to add product:", error);
    },
  });
};

export const useProductDetail = (productId: number) => {
  return useQuery({
    queryKey: ["Product Detail", productId],
    queryFn: async () => {
      const response = await api.get<ProductDetailedResponse>(`/products/${productId}`);
      return response.data;
    },
  });
};

export const useLikeProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: number) => {
      const response = await api.post(`/products/${productId}/like`);
      return response.data;
    },
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ["Product Detail", productId] });
      queryClient.invalidateQueries({ queryKey: ["Product Previews"] });
    },
    onError: (error) => {
      console.error("Failed to like product:", error);
    },
  });
};

export const useUnlikeProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: number) => {
      const response = await api.delete(`/products/${productId}/unlike`);
      return response.data;
    },
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ["Product Detail", productId] });
      queryClient.invalidateQueries({ queryKey: ["Product Previews"] });
    },
    onError: (error) => {
      console.error("Failed to unlike product:", error);
    },
  });
};
