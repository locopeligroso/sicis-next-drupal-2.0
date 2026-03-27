import { Typography } from '@/components/composed/Typography';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircleIcon, TruckIcon, ClockIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductPricingCardProps {
  price?: string | null;
  priceUnit?: string;
  inStock?: boolean;
  shippingWarehouse?: string;
  shippingTime?: string;
  className?: string;
}

export function ProductPricingCard({
  price,
  priceUnit = '/sqft',
  inStock = false,
  shippingWarehouse,
  shippingTime,
  className,
}: ProductPricingCardProps) {
  if (!price && !inStock) return null;

  return (
    <Card className={cn('md:max-w-sm', className)}>
      <CardContent className="flex flex-col gap-4">
        {/* Price */}
        {price ? (
          <div className="flex flex-col gap-0.5">
            <Typography
              textRole="body-sm"
              as="span"
              className="text-muted-foreground"
            >
              Starting at
            </Typography>
            <div className="flex items-baseline gap-2">
              <Typography textRole="h3" as="span">
                {price}
              </Typography>
              {priceUnit && (
                <Typography
                  textRole="body-sm"
                  as="span"
                  className="text-muted-foreground"
                >
                  {priceUnit}
                </Typography>
              )}
            </div>
          </div>
        ) : null}

        {/* Stock + Shipping */}
        {inStock ? (
          <>
            {price && <Separator />}
            <div className="flex flex-col gap-2">
              <Badge variant="default" className="w-fit">
                <CheckCircleIcon data-icon="inline-start" />
                In stock
              </Badge>
              {shippingWarehouse && (
                <div className="flex items-center gap-2">
                  <TruckIcon className="size-4 text-muted-foreground" />
                  <Typography
                    textRole="body-sm"
                    as="span"
                    className="text-muted-foreground"
                  >
                    {shippingWarehouse}
                  </Typography>
                </div>
              )}
              {shippingTime && (
                <div className="flex items-center gap-2">
                  <ClockIcon className="size-4 text-muted-foreground" />
                  <Typography
                    textRole="body-sm"
                    as="span"
                    className="text-muted-foreground"
                  >
                    {shippingTime}
                  </Typography>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {price && <Separator />}
            <Badge variant="outline" className="w-fit">
              Out of stock
            </Badge>
          </>
        )}
      </CardContent>
    </Card>
  );
}
