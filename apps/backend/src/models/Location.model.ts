import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
  locationName: string;
  city: string;
  state: string;
  lga?: string;
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  locationType: 'OFFICE' | 'WAREHOUSE' | 'CLIENT_SITE' | 'OPERATIONAL_BASE' | 'OTHER';
  isActive: boolean;
  totalBits: number;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    locationName: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    lga: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    locationType: {
      type: String,
      enum: ['OFFICE', 'WAREHOUSE', 'CLIENT_SITE', 'OPERATIONAL_BASE', 'OTHER'],
      default: 'OPERATIONAL_BASE',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    totalBits: {
      type: Number,
      default: 0,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for location search
LocationSchema.index({ locationName: 'text', city: 'text', state: 'text', address: 'text' });

export const Location = mongoose.model<ILocation>('Location', LocationSchema);
