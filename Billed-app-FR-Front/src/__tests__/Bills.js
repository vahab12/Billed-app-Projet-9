import { screen, waitFor, within } from '@testing-library/dom';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import BillsUI from '../views/BillsUI.js';
import { bills } from '../fixtures/bills.js';
import { ROUTES, ROUTES_PATH } from '../constants/routes';
import { localStorageMock } from '../__mocks__/localStorage.js';
import mockedStore from '../__mocks__/store';
import router from '../app/Router.js';
import Bills from '../containers/Bills.js';

jest.mock('../app/store', () => mockedStore);

describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
    test('Then bill icon in vertical layout should be highlighted', async () => {
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });

      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );

      const root = document.createElement('div');

      root.setAttribute('id', 'root');

      document.body.append(root);

      router();

      window.onNavigate(ROUTES_PATH.Bills);

      const windowIcon = screen.getByTestId('icon-window');

      await waitFor(() => windowIcon);

      expect(windowIcon).toHaveClass('active-icon'); //TODO 5
    });

    test('Then bills should be ordered from earliest to latest', () => {
      document.body.innerHTML = BillsUI({
        data: bills,
      });

      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);

      const antiChrono = (a, b) => (a < b ? 1 : -1);

      const datesSorted = [...dates].sort(antiChrono);

      expect(dates).toEqual(datesSorted);
    });

    // -------------------------------------------------------- //

    //Lorsque je clique sur le bouton Nouvelle not des frais
    //Alors je devrais être envoyé sur le formulaire de nouvelle note de frais
    describe('When I click on New Bill Button', () => {
      test('Then I should be sent on New Bill form', () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        Object.defineProperty(window, 'localStorage', {
          value: localStorageMock,
        });

        window.localStorage.setItem(
          'user',
          JSON.stringify({
            type: 'Employee',
          })
        );

        const bills = new Bills({
          document,
          onNavigate,
          store: mockedStore,
          localStorage: window.localStorage,
        });

        document.body.innerHTML = BillsUI({ data: bills });

        const buttonNewBill = screen.getByRole('button', {
          name: /nouvelle note de frais/i,
        });

        expect(buttonNewBill).toBeTruthy();

        const handleClickNewBill = jest.fn(bills.handleClickNewBill);

        buttonNewBill.addEventListener('click', handleClickNewBill);

        userEvent.click(buttonNewBill);

        expect(handleClickNewBill).toHaveBeenCalled();
      });
    });

    //Lorsque je clique sur l'icône d'un œil
    //Une modale devrait alors s'ouvrir
    describe('When I click on one eye icon', () => {
      test('Then a modal should open', async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        Object.defineProperty(window, 'localStorage', {
          value: localStorageMock,
        });

        window.localStorage.setItem(
          'user',
          JSON.stringify({
            type: 'Employee',
          })
        );

        const billsPage = new Bills({
          document,
          onNavigate,
          store: mockedStore,
          localStorage: window.localStorage,
        });

        document.body.innerHTML = BillsUI({ data: bills });

        const iconEyes = screen.getAllByTestId('icon-eye');

        const handleClickIconEye = jest.fn(billsPage.handleClickIconEye);

        const modale = document.getElementById('modaleFile');

        $.fn.modal = jest.fn(() => modale.classList.add('show')); //mock de la modale Bootstrap

        iconEyes.forEach((iconEye) => {
          iconEye.addEventListener('click', () => handleClickIconEye(iconEye));

          userEvent.click(iconEye);

          expect(handleClickIconEye).toHaveBeenCalled();

          expect(modale).toHaveClass('show');
        });
      });
    });

    //Quand je suis allé sur la page de Bills et qu'elle est en train de charger
    //Ensuite, la page de chargement devrait être rendue
    describe('When I went on Bills page and it is loading', () => {
      test('Then, Loading page should be rendered', () => {
        document.body.innerHTML = BillsUI({ loading: true });

        expect(screen.getByText('Loading...')).toBeVisible();

        document.body.innerHTML = '';
      });
    });

    //Number 6 test d'intégration GET

    //Lorsque je navigue sur la page des factures
    //Récupère les factures à partir de l'API GET fictive
    describe('When I navigate to Bills Page', () => {
      test('fetches bills from mock API GET', async () => {
        jest.spyOn(mockedStore, 'bills');

        Object.defineProperty(window, 'localStorage', {
          value: localStorageMock,
        });

        localStorage.setItem(
          'user',
          JSON.stringify({ type: 'Employee', email: 'a@a' })
        );

        const root = document.createElement('div');

        root.setAttribute('id', 'root');

        document.body.append(root);

        router();

        window.onNavigate(ROUTES_PATH.Bills);

        await waitFor(() => screen.getByText('Mes notes de frais'));

        const newBillBtn = await screen.findByRole('button', {
          name: /nouvelle note de frais/i,
        });

        const billsTableRows = screen.getByTestId('tbody');

        expect(newBillBtn).toBeTruthy();

        expect(billsTableRows).toBeTruthy();

        expect(within(billsTableRows).getAllByRole('row')).toHaveLength(4);
      });

      //récupère des factures à partir d'une API et échoue avec un message d'erreur 404
      test('fetches bills from an API and fails with 404 message error', async () => {
        mockedStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error('Erreur 404'));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);

        await new Promise(process.nextTick);

        const message = screen.getByText(/Erreur 404/);

        expect(message).toBeTruthy();
      });

      //Récupère les messages à partir d'une API et échoue avec une erreur de message 500
      test('fetches messages from an API and fails with 500 message error', async () => {
        mockedStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error('Erreur 500'));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);

        await new Promise(process.nextTick);

        const message = screen.getByText(/Erreur 500/);

        expect(message).toBeTruthy();
      });
    });
  });
});
