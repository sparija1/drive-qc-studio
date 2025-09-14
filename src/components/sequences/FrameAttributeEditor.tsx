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
  weather: z.enum(['sunny', 'cloudy', 'rainfall', 'snowfall']).optional(),
  "day-night": z.enum(['day', 'night']).optional(),
  "road-type": z.enum(['highway', 'city', 'suburb', 'rural']).optional(),
  lanes: z.string().optional(),
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
      weather: frame.weather as any || undefined,
      "day-night": frame["day-night"] as any || undefined,
      "road-type": frame["road-type"] as any || undefined,
      lanes: frame.lanes || undefined,
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
      weather: frame.weather as any || undefined,
      "day-night": frame["day-night"] as any || undefined,
      "road-type": frame["road-type"] as any || undefined,
      lanes: frame.lanes || undefined,
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
              <span className="text-muted-foreground">Weather:</span>
              <Badge variant="secondary" className="ml-2">
                {frame.weather ?? 'N/A'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Time:</span>
              <Badge variant="secondary" className="ml-2">
                {frame["day-night"] ?? 'N/A'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Road:</span>
              <Badge variant="secondary" className="ml-2">
                {frame["road-type"] ?? 'N/A'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Lanes:</span>
              <Badge variant="secondary" className="ml-2">
                {frame.lanes ?? 'N/A'}
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
                name="weather"
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
                        <SelectItem value="rainfall">Rainfall</SelectItem>
                        <SelectItem value="snowfall">Snowfall</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="day-night"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time of Day</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="night">Night</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="road-type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Road Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select road type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="highway">Highway</SelectItem>
                        <SelectItem value="city">City</SelectItem>
                        <SelectItem value="suburb">Suburb</SelectItem>
                        <SelectItem value="rural">Rural</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lanes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lanes</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lanes" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="one lane">One lane</SelectItem>
                        <SelectItem value="two way traffic">Two way traffic</SelectItem>
                        <SelectItem value="more than two lanes">More than two lanes</SelectItem>
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