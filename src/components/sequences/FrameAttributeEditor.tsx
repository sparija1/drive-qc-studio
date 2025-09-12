import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Frame, useUpdateFrame } from "@/hooks/useFrames";
import { Save, Edit } from "lucide-react";

const formSchema = z.object({
  vehicle_count: z.coerce.number().min(0).optional(),
  pedestrian_count: z.coerce.number().min(0).optional(),
  lane_count: z.coerce.number().min(1).optional(),
  scene_type: z.enum(['highway', 'urban', 'rural', 'suburban']).optional(),
  weather_condition: z.enum(['sunny', 'cloudy', 'rainy', 'foggy', 'snowy']).optional(),
  traffic_density: z.enum(['light', 'moderate', 'heavy']).optional(),
  traffic_light_status: z.enum(['red', 'yellow', 'green', 'none']).optional(),
  accuracy: z.coerce.number().min(0).max(1).optional(),
});

interface FrameAttributeEditorProps {
  frame: Frame;
}

export const FrameAttributeEditor = ({ frame }: FrameAttributeEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const updateFrame = useUpdateFrame();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicle_count: frame.vehicle_count || undefined,
      pedestrian_count: frame.pedestrian_count || undefined,
      lane_count: frame.lane_count || undefined,
      scene_type: frame.scene_type as any || undefined,
      weather_condition: frame.weather_condition as any || undefined,
      traffic_density: frame.traffic_density as any || undefined,
      traffic_light_status: frame.traffic_light_status as any || undefined,
      accuracy: frame.accuracy || undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateFrame.mutateAsync({
        id: frame.id,
        data: values,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating frame:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    form.reset({
      vehicle_count: frame.vehicle_count || undefined,
      pedestrian_count: frame.pedestrian_count || undefined,
      lane_count: frame.lane_count || undefined,
      scene_type: frame.scene_type as any || undefined,
      weather_condition: frame.weather_condition as any || undefined,
      traffic_density: frame.traffic_density as any || undefined,
      traffic_light_status: frame.traffic_light_status as any || undefined,
      accuracy: frame.accuracy || undefined,
    });
  };

  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Frame Attributes</CardTitle>
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Vehicles:</span>
              <Badge variant="secondary" className="ml-2">
                {frame.vehicle_count ?? 'N/A'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Pedestrians:</span>
              <Badge variant="secondary" className="ml-2">
                {frame.pedestrian_count ?? 'N/A'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Lanes:</span>
              <Badge variant="secondary" className="ml-2">
                {frame.lane_count ?? 'N/A'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Accuracy:</span>
              <Badge variant="secondary" className="ml-2">
                {frame.accuracy ? `${(frame.accuracy * 100).toFixed(1)}%` : 'N/A'}
              </Badge>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-muted-foreground">Scene:</span>
              <Badge variant="outline" className="ml-2">
                {frame.scene_type ?? 'N/A'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Weather:</span>
              <Badge variant="outline" className="ml-2">
                {frame.weather_condition ?? 'N/A'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Traffic:</span>
              <Badge variant="outline" className="ml-2">
                {frame.traffic_density ?? 'N/A'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Traffic Light:</span>
              <Badge variant="outline" className="ml-2">
                {frame.traffic_light_status ?? 'N/A'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Edit Frame Attributes</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicle_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Count</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pedestrian_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pedestrian Count</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lane_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lane Count</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accuracy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accuracy (0-1)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="1" step="0.01" placeholder="0.95" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scene_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scene Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scene type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="highway">Highway</SelectItem>
                        <SelectItem value="urban">Urban</SelectItem>
                        <SelectItem value="rural">Rural</SelectItem>
                        <SelectItem value="suburban">Suburban</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weather_condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weather</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select weather" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sunny">Sunny</SelectItem>
                        <SelectItem value="cloudy">Cloudy</SelectItem>
                        <SelectItem value="rainy">Rainy</SelectItem>
                        <SelectItem value="foggy">Foggy</SelectItem>
                        <SelectItem value="snowy">Snowy</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="traffic_density"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Traffic Density</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select traffic" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="heavy">Heavy</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="traffic_light_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Traffic Light</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="red">Red</SelectItem>
                        <SelectItem value="yellow">Yellow</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateFrame.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateFrame.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};