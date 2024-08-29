export const removeMimeBase64 = async (imageBase64: string) => {
  const base64Pattern = /^data:image\/(png|jpeg|jpg|webp);base64,/;
  const convertedBase64Data = imageBase64.replace(base64Pattern, "");
  return convertedBase64Data;
};
