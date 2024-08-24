/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES } from "../constants/routes.js";
import mockStore from "../__mocks__/store.js";
import userEvent from "@testing-library/user-event";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import store from "../__mocks__/store.js";

jest.mock("../app/store", () => mockStore);

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
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "e@e" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      expect(screen.getAllByTestId("icon-window")).toBeTruthy();
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "e@e",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
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
    describe("When I click on one eye icon", () => {
      test("Then a modal should open", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });

        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );

        const billsPage = new Bills({
          document,
          onNavigate,
          store: store,
          localStorage: window.localStorage,
        });

        document.body.innerHTML = BillsUI({ data: bills });

        const iconEyes = screen.getAllByTestId("icon-eye");

        const handleClickIconEye = jest.fn(billsPage.handleClickIconEye);

        const modal = document.getElementById("modaleFile");

        $.fn.modal = jest.fn(() => modal.classList.add("show"));

        iconEyes.forEach((iconEye) => {
          iconEye.addEventListener("click", () => handleClickIconEye(iconEye));
          userEvent.click(iconEye);

          expect(handleClickIconEye).toHaveBeenCalled();

          expect(modal).toBeTruthy();
        });
      });
    });
  });
});
