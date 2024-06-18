export function formDataToObject (formData: FormData) {
    const obj: Record<string, any> = {};
    formData.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  };