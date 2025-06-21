import { createFileRoute } from '@tanstack/react-router'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/patient/results')({
  component: PatientResults,
})

const mockResults = [
  {
    id: 'res_456',
    type: 'Prostate Cancer Screening',
    center: 'General Hospital',
    date: '2024-06-20',
    status: 'Ready',
    fileUrl: '/mock-results/prostate-screening-456.pdf',
  },
  {
    id: 'res_123',
    type: 'Cervical Cancer Screening',
    center: 'City Health Clinic',
    date: '2024-03-15',
    status: 'Pending',
    fileUrl: null,
  },
  {
    id: 'res_789',
    type: 'Breast Cancer Screening',
    center: 'Wellness Center',
    date: '2023-11-05',
    status: 'Ready',
    fileUrl: '/mock-results/breast-screening-789.pdf',
  },
]

function PatientResults() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">My Results</h1>
        <p className="text-muted-foreground">
          Here you can view your screening results.
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Screening Type</TableHead>
                <TableHead>Center</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockResults.map((result) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">{result.type}</TableCell>
                  <TableCell>{result.center}</TableCell>
                  <TableCell>{result.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        result.status === 'Ready' ? 'default' : 'secondary'
                      }
                    >
                      {result.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={result.status !== 'Ready'}
                      asChild
                    >
                      <a href={result.fileUrl!} download>
                        Download
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
