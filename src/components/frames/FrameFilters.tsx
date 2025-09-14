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
    weather: string;
    status: string;
    lanes: string;
  };
  onFiltersChange: (filters: any) => void;
  availableValues: {
    timeOfDay: string[];
    roadType: string[];
    weather: string[];
    status: string[];
    lanes: string[];
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
      weather: 'all',
      status: 'all',
      lanes: 'all'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.timeOfDay !== 'all') count++;
    if (filters.roadType !== 'all') count++;
    if (filters.weather !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.lanes !== 'all') count++;
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

        {/* Lanes Filter */}
        <div>
          <Label className="text-sm font-medium">Lanes</Label>
          <Select value={filters.lanes} onValueChange={(value) => updateFilter('lanes', value)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All lane types" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
              <SelectItem value="all">All lane types</SelectItem>
              {availableValues.lanes.map(value => (
                <SelectItem key={value} value={value} className="capitalize">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>
    </div>
  );
};