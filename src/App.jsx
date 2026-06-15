import { Logo, Button, Card, Field, Input, Table, StatusBadge } from './components/brand'

// FE-0 scaffold landing — verifies the brand system renders. Replaced by the
// session/role router in FE-1.
export default function App() {
  return (
    <div className="min-h-screen bg-chalk">
      <header className="border-b-hair border-stone">
        <div className="mx-auto flex max-w-page items-center justify-between px-6 py-5 sm:px-16">
          <Logo size={28} />
          <span className="tc-subhead">Decarbonization Roadmap</span>
        </div>
      </header>

      <main className="mx-auto max-w-page px-6 py-16 sm:px-16">
        <p className="tc-label mb-4">Scaffold ready</p>
        <h1 className="tc-h1 max-w-content">
          A live roadmap from base year to net-zero.
        </h1>
        <p className="tc-body mt-6 max-w-content">
          The Corporate's two static decarbonization charts, turned into a live, role-based
          tool: the waterfall bridge, the year-on-year trajectory, a financial MAC view, and a
          project submission and approval workflow.
        </p>

        <div className="mt-12 flex flex-wrap gap-4">
          <Button variant="primary">Primary action</Button>
          <Button variant="secondary">Secondary action</Button>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <p className="tc-subhead mb-4">Surface card</p>
            <Field label="Project name" htmlFor="demo" hint="Square inputs, hairline borders.">
              <Input id="demo" placeholder="e.g. Rooftop solar" />
            </Field>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge status="evaluation" />
              <StatusBadge status="pending" />
              <StatusBadge status="approved" />
              <StatusBadge status="restudy" />
            </div>
          </Card>

          <Card elevated>
            <p className="tc-subhead mb-4">Elevated card</p>
            <Table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Area</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>LED &amp; HVAC retrofit</td>
                  <td>Energy efficiency</td>
                  <td><StatusBadge status="approved" /></td>
                </tr>
                <tr>
                  <td>Off-site PPA</td>
                  <td>Renewables</td>
                  <td><StatusBadge status="pending" /></td>
                </tr>
              </tbody>
            </Table>
          </Card>
        </div>
      </main>
    </div>
  )
}
