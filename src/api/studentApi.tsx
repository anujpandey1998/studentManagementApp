import { axiosInstance } from './axiosClient';

export const getStudents = async () => {
  const response = await axiosInstance.get('/users');
  return response.data;
};
