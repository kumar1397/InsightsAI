const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_AWS_URL;

async function request(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${endpoint}`, options);

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }

  return res.json();
}

export const api = {
  getProjects: () => request("/getProjects"),
};