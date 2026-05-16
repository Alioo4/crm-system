export interface IOrder {
  id: string;

  createdAt: Date;
  updatedAt: Date;

  name: string | null;
  phone: string | null;
  comment: string | null;

  endDateJob: Date | null;
  workerArrivalDate: Date | null;

  status: string;

  getPrePaymentDate: Date | null;
  getAllPaymentDate: Date | null;

  managerId: string | null;
  managerName: string | null;
  managerphone: string | null;

  zamirId: string | null;
  zamirName: string | null;
  zamirPhone: string | null;

  zavodId: string | null;
  zavodName: string | null;
  zavodPhone: string | null;

  ustId: string | null;
  ustName: string | null;
  ustPhone: string | null;

  total: number | null;
  prePayment: number | null;
  dueAmount: number | null;

  regionId?: string | null;

  longitude?: number | null;
  latitude?: number | null;

  socialId?: string | null;
  orderStatusId?: string | null;

  region?: Region | null;
  social?: Social | null;
  orderStatus?: OrderStatus | null;

  roomMeasurement?: RoomMeasurement[];
  currencyOrder?: CurrencyOrder[];
}

export interface Region {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
}

export interface Social {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
}

export interface OrderStatus {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
}

export interface RoomMeasurement {
  id: string;

  createdAt: Date | string;
  updatedAt: Date | string;

  name: string | null;
  key: string | null;
  value: string | null;

  orderId: string;
}

export interface CurrencyOrder {
  id?: string;

  createdAt?: Date;
  updatedAt?: Date;

  amount?: number;
  currency?: string;

  orderId?: string;
}
