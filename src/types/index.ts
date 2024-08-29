export interface UploadBody {
  image: string;
  customer_code: string;
  measure_datetime: string;
  measure_type: "WATER" | "GAS";
}

export interface PatchRequestBody {
  measure_uuid: string;
  confirmed_value: number;
}

export interface UploadResponse {
  image_url: string;
  measure_uuid: string;
  measure_value: number | null;
}
