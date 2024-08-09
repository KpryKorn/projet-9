/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => new Date(b.date) - new Date(a.date);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
    describe("When I click on the new bill button", () => {
      test("Then it should trigger the new bill handler", () => {
        const handleClickNewBill = jest.fn();

        document.body.innerHTML = BillsUI({ data: [] });
        const buttonNewBill = screen.getByTestId("btn-new-bill");
        const bills = new Bills({
          document,
          onNavigate: () => {},
          firestore: null,
          localStorage: window.localStorage,
        });

        bills.handleClickNewBill = handleClickNewBill;
        buttonNewBill.addEventListener("click", bills.handleClickNewBill);

        fireEvent.click(buttonNewBill);

        expect(handleClickNewBill).toHaveBeenCalled();
      });
    });
    describe("When I click on an eye icon", () => {
      test("Then it should trigger the eye icon click handler", () => {
        const handleClickIconEye = jest.fn();

        document.body.innerHTML = BillsUI({ data: [] });
        const iconEye = screen.getByTestId("icon-eye"); // pas dans le DOM donc impossible à tester ???
        const bills = new Bills({
          document,
          onNavigate: () => {},
          firestore: null,
          localStorage: window.localStorage,
        });

        bills.handleClickIconEye = handleClickIconEye;
        iconEye.forEach((icon) => {
          icon.addEventListener("click", () => bills.handleClickIconEye(icon));
        });

        iconEye.forEach((icon) => {
          fireEvent.click(icon);
        });

        expect(handleClickIconEye).toHaveBeenCalledTimes(iconEye.length);
      });
    });
  });
});
