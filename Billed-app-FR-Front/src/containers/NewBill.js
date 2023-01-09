import { ROUTES_PATH } from '../constants/routes.js';
import Logout from './Logout.js';

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const formNewBill = this.document.querySelector(
      `form[data-testid="form-new-bill"]`
    );
    formNewBill.addEventListener('submit', this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener('change', this.handleChangeFile);
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });
  }

  /**********Ajaur de la fonction filValidation*********/
  fileValidation = (file) => {
    //On verifie le type de fichier à uploader
    const fileTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    //si fileTypes n'est pas includ, ajaut de claslist 'is invalid' et returne fals
    if (!fileTypes.includes(file.type)) {
      this.document
        .querySelector(`input[data-testid="file"]`)
        .classList.add('is-invalid');
      return false;
      //Sinon remove 'is invalid' classlist et returne true
    } else {
      this.document
        .querySelector(`input[data-testid="file"]`)
        .classList.remove('is-invalid');
      return true;
    }
  };

  /**********??????Ajaut d'async devant la fonction??????**********/
  handleChangeFile = (e) => {
    e.preventDefault();
    const file = this.document.querySelector(`input[data-testid="file"]`)
      .files[0];
    const filePath = e.target.value.split(/\\/g);
    const fileName = filePath[filePath.length - 1];
    const formData = new FormData();
    const email = JSON.parse(localStorage.getItem('user')).email;
    formData.append('file', file);
    formData.append('email', email);

    /********** Ajaut de "this.fileValidation(file) &&"**********/
    this.fileValidation(file) &&
      this.store //Si type de fichier incorrect, on ne l'envoie pas vers le store
        .bills()
        .create({
          data: formData,
          headers: {
            noContentType: true,
          },
        })
        .then(({ fileUrl, key }) => {
          console.log(fileUrl);
          this.billId = key;
          this.fileUrl = fileUrl;
          this.fileName = fileName;
        })
        .catch((error) => console.error(error));
  };

  handleSubmit = (e) => {
    e.preventDefault();
    //*****Commanté le consol log */
    /*
    console.log(
      'e.target.querySelector(`input[data-testid="datepicker"]`).value',
      e.target.querySelector(`input[data-testid="datepicker"]`).value
    );
 */
    const email = JSON.parse(localStorage.getItem('user')).email;
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(
        e.target.querySelector(`input[data-testid="amount"]`).value
      ),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct:
        parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) ||
        20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`)
        .value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending',
    };

    /***********Ajaut de "if (!this.fileName) return;" **************/
    if (!this.fileName) return;
    //Si pas de fichier selectionné, submit impossible
    this.updateBill(bill);
    this.onNavigate(ROUTES_PATH['Bills']);
  };

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH['Bills']);
        })
        .catch((error) => console.error(error));
    }
  };
}
