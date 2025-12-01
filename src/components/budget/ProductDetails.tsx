
import React from 'react';
import { formatCurrency } from '../../types/pricing';
import { Separator } from '../ui/separator';

interface ProductDetailsProps {
  productDetails: React.ReactNode;
  baseTotal: number;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ productDetails, baseTotal }) => {
  return (
    <>
      {productDetails}
      
      <div className="flex justify-between text-body text-sm">
        <span>Subtotal do Produto:</span>
        <span className="currency-value">{formatCurrency(baseTotal)}</span>
      </div>
      
      <Separator className="separator-enhanced" />
    </>
  );
};

export default ProductDetails;
