/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe('When I am on the NewBill Page and click on the "change file" button', () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      Object.defineProperty(window, "location", {
        value: { hash: ROUTES_PATH["NewBill"] },
      });

      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      document.body.innerHTML = `<div id="root"></div>`;
      router();
    });

    // Test : Choix d'un fichier avec une extension valide
    test("Then I can choose a file with a valid extension", async () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const inputFile = screen.getByTestId("file");

      const file = new File(["contenu du fichier fake"], "facture.png", {
        type: "image/png",
      });

      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, { target: { files: [file] } });

      expect(handleChangeFile).toBeCalled();
      expect(inputFile.files.length).toBe(1);
      expect(inputFile.files[0].name).toBe("facture.png");
    });

    // Test : Choix d'un fichier avec une extension non valide
    test("Then I can choose a file with an invalid extension", async () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const inputFile = screen.getByTestId("file");

      const file = new File(["contenu du fichier fake"], "facture.pdf", {
        type: "application/pdf",
      });

      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, { target: { files: [file] } });

      expect(handleChangeFile).toBeCalled();
      expect(inputFile.value).toBeFalsy();
    });
  });

  describe("When I fill in the fields with the correct format and click the submit button", () => {
    test("Then I should post a new Bill ticket", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const inputData = {
        type: "Transports",
        name: "Billet de train Paris - Marseille",
        amount: "250",
        date: "2023-04-25",
        vat: 80,
        pct: 25,
        file: new File(["billet de train"], "billet.png", {
          type: "image/png",
        }),
        commentary: "Note de deplacement professionnel",
        status: "pending",
      };

      const inputType = screen.getByTestId("expense-type");
      const inputName = screen.getByTestId("expense-name");
      const inputDate = screen.getByTestId("datepicker");
      const inputAmount = screen.getByTestId("amount");
      const inputVat = screen.getByTestId("vat");
      const inputPct = screen.getByTestId("pct");
      const inputComment = screen.getByTestId("commentary");
      const inputFile = screen.getByTestId("file");
      const form = screen.getByTestId("form-new-bill");

      fireEvent.change(inputType, { target: { value: inputData.type } });
      fireEvent.change(inputName, { target: { value: inputData.name } });
      fireEvent.change(inputDate, { target: { value: inputData.date } });
      fireEvent.change(inputAmount, { target: { value: inputData.amount } });
      fireEvent.change(inputVat, { target: { value: inputData.vat } });
      fireEvent.change(inputPct, { target: { value: inputData.pct } });
      fireEvent.change(inputComment, {
        target: { value: inputData.commentary },
      });

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      inputFile.addEventListener("change", handleChangeFile);
      form.addEventListener("submit", handleSubmit);

      userEvent.upload(inputFile, inputData.file);
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      expect(inputType.validity.valid).toBeTruthy();
      expect(inputName.validity.valid).toBeTruthy();
      expect(inputDate.validity.valid).toBeTruthy();
      expect(inputAmount.validity.valid).toBeTruthy();
      expect(inputVat.validity.valid).toBeTruthy();
      expect(inputPct.validity.valid).toBeTruthy();
      expect(inputComment.validity.valid).toBeTruthy();
      expect(inputFile.files[0]).toBeDefined();
    });

    // Test : Rendu de la page des factures après la soumission réussie du formulaire
    test("Then it should render the Bills Page", () => {
      expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
    });
  });

  describe("When I fill in the fields with incorrect format and click the submit button", () => {
    test("Then I should have an HTML validation error in the form", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      Object.defineProperty(window, "location", {
        value: { hash: ROUTES_PATH["NewBill"] },
      });

      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      document.body.innerHTML = `<div id="root"></div>`;
      router();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const inputData = {
        type: "test",
        name: "Vol Paris - Berlin",
        amount: "test",
        date: "date incorrecte",
        vat: 70,
        pct: "test",
        file: new File(["img"], "image.png", { type: "image/png" }),
        commentary: "Note de deplacement professionnel",
        status: "pending",
      };

      const inputType = screen.getByTestId("expense-type");
      const inputName = screen.getByTestId("expense-name");
      const inputDate = screen.getByTestId("datepicker");
      const inputAmount = screen.getByTestId("amount");
      const inputVat = screen.getByTestId("vat");
      const inputPct = screen.getByTestId("pct");
      const inputComment = screen.getByTestId("commentary");
      const inputFile = screen.getByTestId("file");
      const form = screen.getByTestId("form-new-bill");

      fireEvent.change(inputType, { target: { value: inputData.type } });
      fireEvent.change(inputName, { target: { value: inputData.name } });
      fireEvent.change(inputDate, { target: { value: inputData.date } });
      fireEvent.change(inputAmount, { target: { value: inputData.amount } });
      fireEvent.change(inputVat, { target: { value: inputData.vat } });
      fireEvent.change(inputPct, { target: { value: inputData.pct } });
      fireEvent.change(inputComment, {
        target: { value: inputData.commentary },
      });

      userEvent.upload(inputFile, inputData.file);

      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      expect(inputType.validity.valid).not.toBeTruthy();
      expect(inputDate.validity.valid).not.toBeTruthy();
      expect(inputAmount.validity.valid).not.toBeTruthy();
      expect(inputPct.validity.valid).not.toBeTruthy();
    });
  });

  // Test d'intégration POST
  describe("When I post a new bill", () => {
    test("Then the new bill should be added to the other bills", async () => {
      jest.spyOn(mockStore, "bills");

      const bills = await mockStore.bills().list();

      // On s'attend à 4 factures pre-test
      expect(bills.length).toEqual(4);

      const newBillTest = {
        email: "employee@test.tld",
        type: "Transports",
        name: "Vol Paris-New York",
        amount: "1375",
        date: "2023-05-16",
        vat: "255",
        pct: "20",
        commentary: "Vol reunion client USA",
        fileUrl: undefined,
        fileName: "test.png",
        status: "pending",
      };

      mockStore.bills().create(newBillTest);

      // On s'attend à 5 factures post-test
      waitFor(() => expect(bills.length).toEqual(5));
    });
  });
});
