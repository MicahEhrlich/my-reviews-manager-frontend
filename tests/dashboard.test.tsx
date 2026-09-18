import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Dashboard from "../app/Dashboard";
import { deriveStats, initialReviews } from "../app/mockData";

describe("dashboard data", () => {
  it("derives the live overview metrics", () => {
    expect(deriveStats(initialReviews)).toMatchObject({ total: 7, pending: 3, positive: 4, negative: 3 });
    expect(deriveStats(initialReviews).average).toBeCloseTo(3.71, 2);
  });
});

describe("dashboard interactions", () => {
  it("renders in Hebrew RTL and filters reviews by location", async () => {
    const user = userEvent.setup();
    const { container } = render(<Dashboard />);
    expect(container.firstChild).toHaveAttribute("dir", "rtl");
    await user.selectOptions(screen.getByLabelText("בחירת עסק"), "lock");
    await user.click(screen.getAllByRole("button", { name: /ניהול ביקורות/ })[0]);
    expect(screen.getByText("דניאל כהן")).toBeInTheDocument();
    expect(screen.getByText("שרון אביטל")).toBeInTheDocument();
    expect(screen.queryByText("נועה לוי")).not.toBeInTheDocument();
  });

  it("approves a pending review and updates its status", async () => {
    const user = userEvent.setup();
    render(<Dashboard />);
    await user.click(screen.getAllByRole("button", { name: /ניהול ביקורות/ })[0]);
    const review = screen.getByText("דניאל כהן").closest("article")!;
    await user.click(within(review).getByRole("button", { name: /אישור ושליחה/ }));
    expect(within(review).getByText("אושר ונשלח")).toBeInTheDocument();
    expect(within(review).queryByRole("button", { name: /אישור ושליחה/ })).not.toBeInTheDocument();
  });

  it("edits and approves an AI response through the dialog", async () => {
    const user = userEvent.setup();
    render(<Dashboard />);
    await user.click(screen.getAllByRole("button", { name: /ניהול ביקורות/ })[0]);
    const review = screen.getByText("יואב פרץ").closest("article")!;
    await user.click(within(review).getByRole("button", { name: "עריכה" }));
    const dialog = screen.getByRole("dialog", { name: "עריכת תגובה" });
    fireEvent.change(within(dialog).getByLabelText("נוסח התגובה"), { target: { value: "יואב, תודה על המשוב. טיפלנו בנושא התורים ונשמח לארח אותך שוב." } });
    await user.click(within(dialog).getByRole("button", { name: /שמירה, אישור ושליחה/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText(/טיפלנו בנושא התורים/)).toBeInTheDocument();
  });

  it("creates a Google post and toggles dark mode", async () => {
    const user = userEvent.setup();
    render(<Dashboard />);
    await user.click(screen.getByRole("button", { name: "מעבר למצב כהה" }));
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem("agency-theme")).toBe("dark");
    await user.click(screen.getAllByRole("button", { name: /פוסטים בגוגל/ })[0]);
    await user.type(screen.getByPlaceholderText("מה חדש בעסק? ספרו ללקוחות שלכם..."), "פוסט חדש שנוצר מתוך בדיקת המערכת");
    await user.click(screen.getByRole("button", { name: "פרסום עכשיו" }));
    expect(screen.getByText("פוסט חדש שנוצר מתוך בדיקת המערכת")).toBeInTheDocument();
  });

  it("selects a business and updates its response tone", async () => {
    const user = userEvent.setup();
    render(<Dashboard />);
    await user.click(screen.getAllByRole("button", { name: /הגדרות/ })[0]);
    await user.click(screen.getByRole("button", { name: /מספרת אלי/ }));
    await user.selectOptions(screen.getByDisplayValue("חם ואישי"), "short");
    expect(screen.getByText(/כך נשמעת תגובה בסגנון “קצר וענייני”/)).toBeInTheDocument();
  });
});
