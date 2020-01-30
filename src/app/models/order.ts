import {Product} from './product';
import {AddressInfo} from './addressInfo';

export class Order {
  uid: string;
  orderNumber: number;
  orderStatus: string;
  // from checkout-form
    // Tracking Related:
  shippingInfo: AddressInfo;
  trackingNumber: string;
    // Billing related:
  billingInfo: AddressInfo;
  // from oder-summary form
  products: Product[];
  coupon?: string;
  totalPrice: number;
  purchaseDate: Date;
}
