"use strict";
class Bank {
    constructor() {
        this.clients = [];
        this.id = 3;
    }
    async getCurses() {
        return await (await fetch("https://api.privatbank.ua/p24api/pubinfo?exchange&json&coursid=11")).json();
    }
    async toStorage() {
        (await this.getCurses()).forEach((item) => item.base_ccy === "UAH" &&
            localStorage.setItem(item.ccy.toLowerCase(), item.sale));
        localStorage.setItem("uah", "1");
    }
    getAllAssets(currency) {
        return this.clients.reduce((acum, client) => {
            acum += this.getClientAssets(client, currency);
            return acum;
        }, 0);
    }
    getClientAssets(client, currency) {
        let sum = 0;
        for (let account of client.accounts) {
            if (account.currency !== currency) {
                sum +=
                    (Number(localStorage.getItem(account.currency)) * account.balance) /
                        Number(localStorage.getItem(currency));
            }
            else {
                sum += account.balance;
            }
        }
        return sum;
    }
    getSumAllCredits(status, currency) {
        let sum = 0;
        let counter = 0;
        let result = {};
        for (let client of this.clients) {
            if (client.status === status && this.hasActiveCredit(client)) {
                sum += this.getSumClientCredit(client, currency);
                ++counter;
            }
        }
        Object.assign(result, { [counter]: sum });
        return result;
    }
    getAllCredits(currency) {
        let creditSum = 0;
        for (let client of this.clients) {
            if (this.hasActiveCredit(client)) {
                creditSum += this.getSumClientCredit(client, currency);
            }
        }
        return creditSum;
    }
    hasActiveCredit(client) {
        for (let account of client.accounts) {
            if (account.account === "credit" &&
                account.creditLimits > account.balance) {
                return true;
            }
        }
        return false;
    }
    getSumClientCredit(client, currency) {
        let creditSum = 0;
        for (let account of client.accounts) {
            if (account.account === "credit" &&
                account.creditLimits > account.balance) {
                if (account.currency !== currency) {
                    creditSum +=
                        (Number(localStorage.getItem(account.currency)) *
                            (account.creditLimits - account.balance)) /
                            Number(localStorage.getItem(currency));
                }
                else {
                    creditSum += account.creditLimits - account.balance;
                }
            }
        }
        console.log(creditSum);
        return creditSum;
    }
    addClient(data) {
        this.clients.push(data);
    }
    deleteClient(id) {
        const index = this.getIndexClient(id);
        this.clients.splice(index, 1);
    }
    addCard(id, dataAccount) {
        const index = this.getIndexClient(id);
        this.clients[index].addAccount(dataAccount);
    }
    getIndexClient(id) {
        return this.clients.findIndex((client) => {
            return client.id === id;
        });
    }
}
class Clients {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.surname = data.surname;
        this.patronymic = data.patronymic;
        this.status = data.status;
        (this.registration = data.registration), (this.accounts = data.accounts);
    }
    addAccount(account) {
        this.accounts.push(account);
    }
}
class Render {
    constructor(container, bankCalculation) {
        this.bankCalculation = bankCalculation;
        this.root = document.querySelector(container);
        this.mainRender(this.root);
        this.modal = this.createModal();
        this.root.append(this.modal);
        this.counter = 0;
    }
    mainRender(container) {
        const wrapperClientsBlock = this.create("div", {
            className: "wrapperClientsBlock",
        });
        const infoBlock = this.create("div", {
            className: "wrapperInfo",
        });
        container.append(infoBlock, wrapperClientsBlock);
        const creditBlock = this.create("div", {
            className: "content",
        });
        const btnCredit = this.create("button", {
            type: "button",
            className: "btn",
            innerText: "посчитать",
        });
        creditBlock.append(this.create("h2", {
            innerText: "Задолженность по активным и неактивным клиентам",
            className: "title",
        }));
        creditBlock.append(btnCredit);
        const selectStatus = this.createSelect({
            "1": "активные",
            "0": "неактивные",
        }, {
            name: "account",
            className: "select",
        });
        const selectCurrency = this.createSelect({
            usd: "доллар",
            uah: "uah",
            rur: "rur",
            eur: "eur",
        }, {
            name: "account",
            className: "select",
        });
        creditBlock.append(selectStatus, selectCurrency);
        const creditOutput = this.create("span", {
            className: "output",
        });
        creditBlock.append(creditOutput);
        infoBlock.append(creditBlock);
        btnCredit.onclick = this.getCreditsOnclick.bind(this, selectStatus, selectCurrency, creditOutput);
        const allAssets = this.create("div", {
            className: "content",
        });
        infoBlock.append(allAssets);
        const btnAssets = this.create("button", {
            type: "button",
            className: "btn",
            innerText: "посчитать",
        });
        const selectAssetsCurrency = this.createSelect({
            usd: "usd",
            uah: "uah",
            rur: "rur",
            eur: "eur",
        }, {
            name: "account",
            className: "select",
        });
        const assetsOutput = this.create("span", {
            className: "output",
        });
        allAssets.append(btnAssets, selectAssetsCurrency, assetsOutput);
        btnAssets.onclick = this.getAllAssetsOnclick.bind(this, selectAssetsCurrency, assetsOutput);
        const allCredit = this.create("div", {
            className: "content",
        });
        allAssets.append(allCredit);
        const btnAllCredit = this.create("button", {
            type: "button",
            className: "btn",
            innerText: "посчитать",
        });
        const selectCurrencyAllCredit = this.createSelect({
            usd: "usd",
            uah: "uah",
            rur: "rur",
            eur: "eur",
        }, {
            name: "account",
            className: "select",
        });
        const allCreditOutput = this.create("span", {
            className: "output",
        });
        allCredit.append(btnAllCredit, selectCurrencyAllCredit, allCreditOutput);
        btnAllCredit.onclick = this.getAllCreditsOnclick.bind(this, selectCurrencyAllCredit, allCreditOutput);
        const wrapperAddClientBlock = this.create("div", {
            className: "content",
        });
        const btnAddClientBlock = this.create("button", {
            type: "button",
            className: "btn",
            innerText: "Добавить",
        });
        btnAddClientBlock.onclick = this.addNewClientOnclick.bind(this);
        const titleAddClientBlock = this.create("h2", {
            innerText: "Добавить клиента",
            className: "title",
        });
        wrapperAddClientBlock.append(titleAddClientBlock, btnAddClientBlock);
        const wrapperClientsList = this.create("div", {
            className: "lists",
        });
        wrapperClientsBlock.append(wrapperAddClientBlock, wrapperClientsList);
        this.renderClientsList(wrapperClientsList);
    }
    addNewClientOnclick() {
        this.showeModal();
    }
    handleClick(event) {
        const dataAtribbute = event.target.getAttribute("data-action");
        if (dataAtribbute) {
            event.preventDefault();
            const temp = event.target.closest("div.card");
            const id = Number(temp.getAttribute("data-id"));
            console.log(id);
            dataAtribbute === "deleteClient" ? this.deleteClient(id) : this.edit(id);
        }
    }
    renderClientsList(container) {
        container.innerHTML = "";
        this.bankCalculation.clients.forEach((client) => {
            container.append(this.renderCard(client));
        });
        container.onclick = this.handleClick.bind(this);
        return container;
    }
    deleteClient(id) {
        this.bankCalculation.clients.splice(this.bankCalculation.getIndexClient(id), 1);
        this.renderClientsList(this.root.querySelector(".lists"));
    }
    edit(id) {
        const index = this.bankCalculation.getIndexClient(id);
        console.log(id);
        this.showeModal(this.bankCalculation.clients[index]);
    }
    renderCard(dataClient) {
        const card = this.create("div", {
            className: "card",
        });
        card.setAttribute("data-id", String(dataClient.id));
        card.innerHTML = `
        <p>
         Имя: <span>${dataClient.name}</span>
        </p>
        <p>
         фамилия: <span>${dataClient.surname}</span>
        </p>
        <p>
         Отчество: <span>${dataClient.patronymic}</span>
        </p>
        <p class="wrapperBtn">
          <button type="button" class="button" data-action="deleteClient">Удалить</button>
          <button type="button" class="button" data-action="edit">Редактировать</button>
        </p>
      `;
        dataClient.accounts.forEach((account) => {
            card.innerHTML += `<div class="account">
          <p>Тип карты:${account.account}</p>
            <p>Доступно: ${account.balance}</p>
            <p>годна до: ${account.activity}</p>
          </div>`;
        });
        return card;
    }
    getAllCreditsOnclick(selectCurrency, container) {
        const currency = this.getSelectValue(selectCurrency);
        container.innerText = this.bankCalculation
            .getAllCredits(currency)
            .toFixed(2);
    }
    getAllAssetsOnclick(selectCurrency, container) {
        const currency = this.getSelectValue(selectCurrency);
        container.innerText = String(this.bankCalculation.getAllAssets(currency));
    }
    createModal() {
        const modal = this.create("div", {
            className: "modal",
        });
        return modal;
    }
    createCardForm(event) {
        if (!this.modal.querySelector(".accountInfo")) {
            event.preventDefault();
            const form = this.create("div", {
                name: "formCard",
                className: "accountInfo",
            });
            const selectCurrency = this.createSelect({
                usd: "usd",
                uah: "uah",
                rur: "rur",
                eur: "eur",
            }, {
                name: "currency",
                className: "select",
            });
            const selectTypeCard = this.createSelect({
                debit: "депозитная",
                credit: "кредитная",
            }, {
                name: "account",
                className: "select",
            });
            const balanceInput = this.createInput({
                name: "balance",
                type: "number",
            });
            const activityInput = this.createInput({
                type: "date",
                name: "activity",
            });
            const creditLimitInput = this.createInput({
                type: "number",
                disabled: "true",
                name: "creditLimits",
            });
            form.append(selectCurrency, selectTypeCard, activityInput, balanceInput, creditLimitInput);
            selectTypeCard.onchange = (event) => {
                creditLimitInput.disabled =
                    this.getSelectValue(event.target) !== "credit";
            };
            this.modal.querySelector("form")?.append(form);
        }
    }
    getSelectValue(select) {
        let indexSelect = select.options.selectedIndex;
        let valueSelect = select.options[indexSelect].value;
        return valueSelect;
    }
    getCreditsOnclick(selectStatus, selectCurrency, container) {
        const currency = this.getSelectValue(selectCurrency);
        const status = Boolean(Number(this.getSelectValue(selectStatus)));
        const resultCredit = this.bankCalculation.getSumAllCredits(status, currency);
        for (let prop in resultCredit) {
            container.innerHTML = `${[prop]}: ${resultCredit[prop].toFixed(2)}`;
        }
    }
    showeModal(dataClient) {
        const id = dataClient?.id ?? 0;
        const form = this.create("form", {
            className: "newClientFormData",
            action: "#",
            method: "POST",
        });
        const inputName = this.createInput({
            type: "text",
            placeholder: "имя",
            name: "name",
            value: dataClient ? dataClient.name : "",
        });
        const inputSurname = this.createInput({
            type: "text",
            placeholder: "фамилия",
            name: "surname",
            value: dataClient ? dataClient.surname : "",
        });
        const inputPatranomic = this.createInput({
            type: "text",
            placeholder: "отчество",
            name: "patronymic",
            value: dataClient ? dataClient.patronymic : "",
        });
        const selectStatus = this.createSelect({
            "1": "активный",
            "0": "неактивный",
        }, {
            name: "status",
            className: "select",
        });
        const btnSend = this.createBtn({
            type: "button",
            className: "btn",
            innerText: "отправить",
        });
        const btnAddCard = this.create("button", {
            type: "button",
            className: "btn",
            innerText: "добавить",
        });
        form.append(inputName, inputSurname, inputPatranomic, selectStatus, btnSend, btnAddCard);
        btnSend.onclick = this.click.bind(this, id);
        btnAddCard.onclick = this.createCardForm.bind(this);
        this.modal.append(form);
        this.modal.classList.add("active");
    }
    click(id, event) {
        event.preventDefault();
        const form = this.modal.querySelector("form");
        console.log(form);
        const formData = new FormData(form);
        this.modal.innerHTML = "";
        this.modal.classList.toggle("active");
        const client = new Clients({
            name: String(formData.get("name")),
            surname: String(formData.get("surname")),
            patronymic: String(formData.get("patronymic")),
            id: id > 0 ? Number(id) : Number(++this.bankCalculation.id),
            status: Boolean(Number(formData.get("status"))),
            registration: new Date().toLocaleDateString(),
            accounts: id > 0
                ? this.bankCalculation.clients[this.bankCalculation.getIndexClient(id)].accounts
                : [],
        });
        if (id > 0) {
            this.bankCalculation.clients.splice(this.bankCalculation.getIndexClient(id), 1, client);
        }
        else {
            id = client.id;
            this.bankCalculation.addClient(client);
        }
        if (formData.has("account")) {
            const card = {
                balance: Number(formData.get("balance")),
                account: String(formData.get("account")),
                currency: String(formData.get("currency")),
                activity: String(formData.get("activity")),
            };
            formData.has("creditLimits") &&
                Object.assign(card, {
                    creditLimits: Number(formData.get("creditLimits")),
                });
            this.bankCalculation.addCard(id, card);
        }
        this.renderClientsList(this.root.querySelector(".lists"));
    }
    createSelect(parameters, props) {
        const select = document.createElement("select");
        for (let parameter in parameters) {
            select.append(new Option(parameters[parameter], parameter));
        }
        Object.assign(select, props);
        return select;
    }
    createInput(props) {
        const input = document.createElement("input");
        Object.assign(input, props);
        return input;
    }
    createBtn(props) {
        const button = document.createElement("button");
        Object.assign(button, props);
        return button;
    }
    create(type, props) {
        const element = document.createElement(type);
        Object.assign(element, props);
        return element;
    }
}
const client = new Clients({
    name: "vika",
    surname: "saveleva",
    patronymic: "Valerievna",
    id: 1,
    status: true,
    registration: "fdsfds",
    accounts: [],
});
const bank = new Bank();
bank.addClient(client);
bank.addClient(new Clients({
    name: "Anton",
    surname: "noone",
    patronymic: "rerer",
    id: 2,
    status: true,
    registration: "rerer",
    accounts: [],
}));
bank.addClient(new Clients({
    name: "vika",
    surname: "saveleva",
    patronymic: "Valerievna",
    id: 3,
    status: true,
    registration: "fdsfds",
    accounts: [],
}));
bank.clients[0].addAccount({
    account: "debit",
    balance: 2300,
    currency: "eur",
    activity: "Sat Apr 13 2025",
});
bank.deleteClient(3);
const renderBank = new Render("#root", bank);
