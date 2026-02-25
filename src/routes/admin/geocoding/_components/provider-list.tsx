import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { GeocodingProvidersResponse } from "@/types/lookup"

interface ProviderListProps {
  data: GeocodingProvidersResponse
}

export function ProviderList({ data }: ProviderListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Providers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead className="text-right">Rate Limit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.providers.map((provider) => (
              <TableRow key={provider.name}>
                <TableCell className="font-medium capitalize">
                  {provider.name}
                </TableCell>
                <TableCell className="capitalize">
                  {provider.service_type}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={provider.is_configured ? "default" : "outline"}
                  >
                    {provider.is_configured ? "Configured" : "Not configured"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {provider.requires_api_key ? "Required" : "Not required"}
                </TableCell>
                <TableCell className="text-right">
                  {provider.rate_limit_delay > 0
                    ? `${provider.rate_limit_delay}s`
                    : "None"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="text-sm">
          <span className="text-muted-foreground">Fallback order: </span>
          <span className="font-medium">
            {data.fallback_order.join(" → ")}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
