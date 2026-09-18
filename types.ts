
export enum Section {
  Petite = 'Petite',
  Moyenne = 'Moyenne',
  Prescolaire = 'Préscolaire'
}

export enum Sexe {
  Garcon = 'Garçon',
  Fille = 'Fille'
}

export interface Child {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  dateInscription: string;
  sexe: Sexe;
  section: Section;
  nomPere: string;
  nomMere: string;
  numPere: string;
  numMere: string;
}

export interface Payment {
  childId: string;
  year: number;
  month: number;
  amountPaid: number;
  paymentDate: string;
}

export type PaymentStatus = 'Payé' | 'Reste à payer' | 'Non payé';

export interface PaymentHistory {
  [childId: string]: {
    [year: number]: {
      [month: number]: Payment;
    };
  };
}

export interface CrecheSettings {
  name: string;
  rc: string;
  nif: string;
  article: string;
  agrement: string;
  address: string;
  tel: string;
  city: string;
}
