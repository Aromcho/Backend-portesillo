import { IsNotEmpty, IsNumber, IsString, IsOptional, IsIn, Min, Max, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class CoordinatesDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

export class UpdateLocationDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;
}

export class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsString()
  @IsIn([
    'pending',
    'accepted',
    'driver_on_way',
    'arrived_pickup',
    'in_progress',
    'arrived_delivery',
    'completed',
    'cancelled',
  ])
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  metadata?: any;
}

export class NotifyArrivalDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['pickup', 'delivery'])
  location: 'pickup' | 'delivery';
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  user: string;

  @IsNotEmpty()
  @IsString()
  pickupAddress: string;

  @IsNotEmpty()
  @IsString()
  deliveryAddress: string;

  // Formato antiguo (retrocompatibilidad)
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  deliveryLatitude?: number;

  @IsOptional()
  @IsNumber()
  deliveryLongitude?: number;

  // Formato nuevo (preferido)
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  pickupCoords?: CoordinatesDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  deliveryCoords?: CoordinatesDto;

  @IsNotEmpty()
  @IsString()
  vehicleType: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distance?: number;

  @IsOptional()
  routeCoords?: Array<{ latitude: number; longitude: number }>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  photos?: string[];
}
