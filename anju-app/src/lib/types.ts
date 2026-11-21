export type Company = "logistics" | "roadways"
export type Role = "owner" | "accountant"
export type LrStatus = "booked" | "in_transit" | "delivered"
export type PayMode = "tbb" | "topay" | "paid"
export type BillTo = "consignor" | "consignee"

export interface Party {
  id: string
  name: string
  gst: string | null
  address: string | null
  phone: string | null
}

export interface Owner {
  id: string
  name: string
  pan: string | null
  phone: string | null
}

export interface Truck {
  id: string
  number: string
  ownerId: string | null
}

export interface Driver {
  id: string
  name: string
  phone: string | null
}

export interface Place {
  id: string
  name: string
}

export interface Payment {
  id: string
  date: string
  amount: number
  note: string | null
}

export interface LocationPing {
  id: string
  at: string
  place: string
}

export interface Lr {
  id: string
  company: Company
  lrNo: number
  date: string
  consignorId: string
  consigneeId: string
  from: string
  to: string
  material: string
  billTo: BillTo
  billAmount: number
  discount: number
  payMode: PayMode
  receipts: Payment[]
  truckId: string | null
  driverId: string | null
  freight: number
  ownerPayments: Payment[]
  /** LR number this one was billed together with ("Incl in LR#") */
  includedIn: number | null
  status: LrStatus
  loadedOn: string | null
  deliveredOn: string | null
  remarks: string | null
  locations: LocationPing[]
}

export interface Db {
  parties: Party[]
  owners: Owner[]
  trucks: Truck[]
  drivers: Driver[]
  places: Place[]
  lrs: Lr[]
}

export type MasterKind = Exclude<keyof Db, "lrs">

export const COMPANY_LABEL: Record<Company, string> = {
  logistics: "Anju Logistics",
  roadways: "Anju Roadways",
}

export const STATUS_LABEL: Record<LrStatus, string> = {
  booked: "Booked",
  in_transit: "On the road",
  delivered: "Delivered",
}

export const PAYMODE_LABEL: Record<PayMode, string> = {
  tbb: "To be billed",
  topay: "To pay (driver collects)",
  paid: "Paid at booking",
}
