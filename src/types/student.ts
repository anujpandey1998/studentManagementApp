export type Student = {
  id: number;
  name: string;
  email: string;
};

// Existing JSONPlaceholder prototype contract, separate from the new domain.
export type DemoStudent = Student & {
  username: string;
  phone: string;
  website: string;
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: { lat: string; lng: string };
  };
  company: { name: string; catchPhrase: string; bs: string };
};

export type CreateStudentDetails = {
  name: string;
  email: string;
};
