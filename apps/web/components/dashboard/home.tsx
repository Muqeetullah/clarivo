import { WidgetSettings } from "./widget-settings";

export function DashboardHome() {
  return (
    <section className="dashboard-home" aria-label="Widget settings">
      <div className="dashboard-page-heading">
        <h2>Widget</h2>
        <p>
          Choose how the widget looks and behaves on your website. The preview
          updates as you go. Changes last until you leave this page or reload.
        </p>
      </div>
      <WidgetSettings />
    </section>
  );
}
