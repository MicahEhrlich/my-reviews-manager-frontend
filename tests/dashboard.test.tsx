import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, MemoryRouter, RouterProvider, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "../src/App";
import { MockReviewsManagerService } from "../src/services/reviewsManager";
import type { Review } from "../src/mockData";

function RouteProbe() {
  const location = useLocation();
  return <output data-testid="route">{location.pathname}{location.search}</output>;
}

function renderApp(initial = "/overview?location=all", service = new MockReviewsManagerService()) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <App service={service} />
      <RouteProbe />
    </MemoryRouter>,
  );
}

describe("dashboard routing and interactions", () => {
  it("renders in Hebrew RTL, redirects unknown routes, and exposes route links", async () => {
    const { container } = renderApp("/missing");
    expect(await screen.findByText("בוקר טוב, מיכל 👋")).toBeInTheDocument();
    expect(container.querySelector(".dashboard-shell")).toHaveAttribute("dir", "rtl");
    expect(screen.getByTestId("route")).toHaveTextContent("/overview?location=all");
    expect(screen.getAllByRole("link", { name: /ניהול ביקורות/ })[0]).toHaveAttribute("href", "/reviews?location=all");
  });

  it("keeps location context in the URL and filters reviews", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText("בוקר טוב, מיכל 👋");
    await user.selectOptions(screen.getByLabelText("בחירת עסק"), "lock");
    await user.click(screen.getAllByRole("link", { name: /ניהול ביקורות/ })[0]);
    expect(screen.getByTestId("route")).toHaveTextContent("/reviews?location=lock");
    expect(await screen.findByText("דניאל כהן")).toBeInTheDocument();
    expect(screen.getByText("שרון אביטל")).toBeInTheDocument();
    expect(screen.queryByText("נועה לוי")).not.toBeInTheDocument();
  });

  it("stores review filters and search in query parameters", async () => {
    const user = userEvent.setup();
    renderApp("/reviews?location=all");
    await screen.findByRole("heading", { name: "ניהול ביקורות" });
    await user.click(screen.getByRole("tab", { name: /ממתין לאישור/ }));
    expect(screen.getByTestId("route")).toHaveTextContent("filter=pending");
    await user.type(screen.getByPlaceholderText("חיפוש לפי שם או תוכן..."), "יואב");
    expect(screen.getByTestId("route")).toHaveTextContent("q=%D7%99%D7%95%D7%90%D7%91");
    expect(screen.getByText("יואב פרץ")).toBeInTheDocument();
    expect(screen.queryByText("דניאל כהן")).not.toBeInTheDocument();
  });

  it("supports browser-style back navigation between product views", async () => {
    const service = new MockReviewsManagerService();
    const router = createMemoryRouter([{
      path: "*",
      element: <><App service={service} /><RouteProbe /></>,
    }], { initialEntries: ["/overview?location=eli"] });
    render(<RouterProvider router={router} />);
    await screen.findByText("בוקר טוב, מיכל 👋");
    await router.navigate("/posts?location=eli");
    expect(await screen.findByRole("heading", { name: "פוסטים בגוגל" })).toBeInTheDocument();
    await router.navigate(-1);
    expect(await screen.findByText("בוקר טוב, מיכל 👋")).toBeInTheDocument();
    expect(screen.getByTestId("route")).toHaveTextContent("/overview?location=eli");
  });

  it("approves and edits reviews through the async service", async () => {
    const user = userEvent.setup();
    renderApp("/reviews?location=all");
    const customer = await screen.findByText("דניאל כהן");
    const review = customer.closest("article")!;
    await user.click(within(review).getByRole("button", { name: /אישור ושליחה/ }));
    expect(await within(review).findByText("אושר ונשלח")).toBeInTheDocument();

    const secondReview = screen.getByText("יואב פרץ").closest("article")!;
    await user.click(within(secondReview).getByRole("button", { name: "עריכה" }));
    const dialog = screen.getByRole("dialog", { name: "עריכת תגובה" });
    fireEvent.change(within(dialog).getByLabelText("נוסח התגובה"), { target: { value: "יואב, תודה על המשוב. טיפלנו בנושא התורים ונשמח לארח אותך שוב." } });
    await user.click(within(dialog).getByRole("button", { name: /שמירה, אישור ושליחה/ }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText(/טיפלנו בנושא התורים/)).toBeInTheDocument();
  });

  it("renders a persisted AI draft and approval controls for a low review", async () => {
    renderApp("/reviews?location=all");
    const customer = await screen.findByText("דניאל כהן");
    const review = customer.closest("article")!;
    expect(within(review).getByText(/מצטערים לשמוע על העיכוב/)).toBeInTheDocument();
    expect(within(review).getByText("ממתין לאישור")).toBeInTheDocument();
    expect(within(review).getByRole("button", { name: /אישור ושליחה/ })).toBeInTheDocument();
    expect(within(review).getByRole("button", { name: "עריכה" })).toBeInTheDocument();
    expect(within(review).getByRole("button", { name: "מחיקה" })).toBeInTheDocument();
  });

  it("creates a post, updates settings, and persists the theme override", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText("בוקר טוב, מיכל 👋");
    await user.click(screen.getByRole("button", { name: "מעבר למצב כהה" }));
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem("agency-theme")).toBe("dark");

    await user.click(screen.getAllByRole("link", { name: /פוסטים בגוגל/ })[0]);
    expect(screen.queryByLabelText(/העלאת תמונה/)).not.toBeInTheDocument();
    await user.type(await screen.findByPlaceholderText(/ספרו על התפריט החדש/), "פוסט חדש שנוצר מתוך בדיקת המערכת");
    await user.click(screen.getByRole("button", { name: /יצירה ופרסום/ }));
    expect(await screen.findByText("חדש אצלנו: פוסט חדש שנוצר מתוך בדיקת המערכת")).toBeInTheDocument();

    await user.click(screen.getAllByRole("link", { name: /הגדרות/ })[0]);
    await user.click(await screen.findByRole("button", { name: /מספרת אלי/ }));
    await user.selectOptions(screen.getByDisplayValue("חם ואישי"), "short");
    expect(await screen.findByText(/כך נשמעת תגובה בסגנון “קצר וענייני”/)).toBeInTheDocument();
  });

  it("shows Hebrew feedback when a service operation fails", async () => {
    class FailingService extends MockReviewsManagerService {
      override async approveReview(): Promise<Review> {
        throw new Error("network unavailable");
      }
    }
    const user = userEvent.setup();
    renderApp("/reviews?location=all", new FailingService());
    const review = (await screen.findByText("דניאל כהן")).closest("article")!;
    await user.click(within(review).getByRole("button", { name: /אישור ושליחה/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("הפעולה לא הושלמה");
    expect(within(review).getByRole("button", { name: /אישור ושליחה/ })).toBeInTheDocument();
  });
});
