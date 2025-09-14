import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface FrameFiltersProps {
  filters: {
    timeOfDay: string;
    roadType: string;
    trafficDensity: string;
    weather: string;
    accuracyThreshold: number;
    status: string;
    vehicleCountMin: number;
    vehicleCountMax: number;
    laneCount: string;
  };
  onFiltersChange: (filters: any) => void;
  availableValues: {
    timeOfDay: string[];
    roadType: string[];
    trafficDensity: string[];
    weather: string[];
    status: string[];
    laneCount: number[];
  };
}

export const FrameFilters = ({ filters, onFiltersChange, availableValues }: FrameFiltersProps) => {
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      timeOfDay: 'all',
      roadType: 'all',
      trafficDensity: 'all',
      weather: 'all',
      accuracyThreshold: 0,
      status: 'all',
      vehicleCountMin: 0,
      vehicleCountMax: 100,
      laneCount: 'all'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.timeOfDay !== 'all') count++;
    if (filters.roadType !== 'all') count++;
    if (filters.trafficDensity !== 'all') count++;
    if (filters.weather !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.laneCount !== 'all') count++;
    if (filters.accuracyThreshold > 0) count++;
    if (filters.vehicleCountMin > 0 || filters.vehicleCountMax < 100) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount} active
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Time of Day Filter */}
        <div>
          <Label className="text-sm font-medium">Time of Day</Label>
          <Select value={filters.timeOfDay} onValueChange={(value) => updateFilter('timeOfDay', value)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All times" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
              <SelectItem value="all">All times</SelectItem>
              {availableValues.timeOfDay.map(value => (
                <SelectItem key={value} value={value} className="capitalize">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Road Type Filter */}
        <div>
          <Label className="text-sm font-medium">Road Type</Label>
          <Select value={filters.roadType} onValueChange={(value) => updateFilter('roadType', value)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All roads" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
              <SelectItem value="all">All roads</SelectItem>
              {availableValues.roadType.map(value => (
                <SelectItem key={value} value={value} className="capitalize">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Traffic Density Filter */}
        <div>
          <Label className="text-sm font-medium">Traffic Density</Label>
          <Select value={filters.trafficDensity} onValueChange={(value) => updateFilter('trafficDensity', value)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All densities" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
              <SelectItem value="all">All densities</SelectItem>
              {availableValues.trafficDensity.map(value => (
                <SelectItem key={value} value={value} className="capitalize">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Weather Filter */}
        <div>
          <Label className="text-sm font-medium">Weather</Label>
          <Select value={filters.weather} onValueChange={(value) => updateFilter('weather', value)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All weather" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
              <SelectItem value="all">All weather</SelectItem>
              {availableValues.weather.map(value => (
                <SelectItem key={value} value={value} className="capitalize">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div>
          <Label className="text-sm font-medium">Status</Label>
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
              <SelectItem value="all">All statuses</SelectItem>
              {availableValues.status.map(value => (
                <SelectItem key={value} value={value} className="capitalize">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lane Count Filter */}
        <div>
          <Label className="text-sm font-medium">Lane Count</Label>
          <Select value={filters.laneCount} onValueChange={(value) => updateFilter('laneCount', value)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All lane counts" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
              <SelectItem value="all">All lane counts</SelectItem>
              {availableValues.laneCount.map(value => (
                <SelectItem key={value.toString()} value={value.toString()}>
                  {value} {value === 1 ? 'lane' : 'lanes'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Vehicle Count Range Filter */}
        <div>
          <Label className="text-sm font-medium">
            Vehicle Count: {filters.vehicleCountMin} - {filters.vehicleCountMax}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Min</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={filters.vehicleCountMin}
                onChange={(e) => updateFilter('vehicleCountMin', parseInt(e.target.value) || 0)}
                className="bg-background"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Max</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={filters.vehicleCountMax}
                onChange={(e) => updateFilter('vehicleCountMax', parseInt(e.target.value) || 100)}
                className="bg-background"
              />
            </div>
          </div>
        </div>

        {/* Accuracy Threshold Filter */}
        <div>
          <Label className="text-sm font-medium">
            Min Accuracy: {(filters.accuracyThreshold * 100).toFixed(0)}%
          </Label>
          <Input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={filters.accuracyThreshold}
            onChange={(e) => updateFilter('accuracyThreshold', parseFloat(e.target.value))}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
};