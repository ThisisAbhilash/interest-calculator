import React from 'react';
import './App.css';
import moment from 'moment';
import PieChart from 'react-minimal-pie-chart';
import InputRange from 'react-input-range';
import 'react-input-range/lib/css/index.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      amountValue: 500,
      monthsValue: 6,
      response: null,
      searchHistory: []
    }
    this.handleMonthChangeSlider = this.handleMonthChangeSlider.bind(this);
    this.handleAmountChangeSlider = this.handleAmountChangeSlider.bind(this);
    this.handleMonthChangeInput = this.handleMonthChangeInput.bind(this);
    this.handleAmountChangeInput = this.handleAmountChangeInput.bind(this);
    this.calculateInterest = this.calculateInterest.bind(this);
  }
  componentWillMount() {
    let searchedData = localStorage.getItem('search-interest-calculator');
    searchedData = searchedData ? JSON.parse(searchedData) : [];
    this.setState({ searchHistory: searchedData });
  }
  groupSearchHistoryByDate(data = []) {
    const resp = {};
    data.map(o => {
      if (resp[moment(o).format('YYYY-MM-DD')]) {
        resp[moment(o).format('YYYY-MM-DD')].push(o);
      }
      else {
        resp[moment(o).format('YYYY-MM-DD')] = [o];
      }
    })
    return resp;
  }
  calculateInterestSearchClick({ amountValue, monthsValue }) {
    return this.setState({ amountValue, monthsValue }, () => this.calculateInterest());
  }
  calculateInterest() {
    const { amountValue, monthsValue } = this.state;

    let searchedData = localStorage.getItem('search-interest-calculator');
    searchedData = searchedData ? JSON.parse(searchedData) : [];
    searchedData.push({ searchedAt: moment(), amountValue, monthsValue });
    localStorage.setItem('search-interest-calculator', JSON.stringify(searchedData));

    fetch(`https://ftl-frontend-test.herokuapp.com/interest?amount=${amountValue}&numMonths=${monthsValue}`)
      .then(res => res.json())
      .then(res => {
        this.setState({ response: res, searchHistory: searchedData });
      })
      .catch(error => {
        console.log('error ', error);
      })
  }
  handleMonthChangeSlider(value) {
    this.setState({ monthsValue: value });
  }
  handleAmountChangeSlider(value) {
    this.setState({ amountValue: value });
  }
  handleMonthChangeInput(event) {
    let incomingValue = parseInt(event.target.value);
    if (incomingValue < 6) {
      alert('Duration cannot be less than 6 months.');
      incomingValue = 6;
    }
    else if (incomingValue > 24) {
      alert('Duration cannot be more than 24 months.');
      incomingValue = 24;
    }
    this.setState({ monthsValue: incomingValue }, () => this.calculateInterest());
  }
  handleAmountChangeInput(event) {
    let incomingValue = parseInt(event.target.value);
    if (incomingValue < 500) {
      alert('Amount cannot be less than 500 USD.');
      incomingValue = 500;
    }
    else if (incomingValue > 5000) {
      alert('Amount cannot be more than 5000 USD.');
      incomingValue = 5000;
    }
    this.setState({ amountValue: incomingValue }, () => this.calculateInterest());
  }
  renderHistory(key, data) {
    const values = data[key];
    values.sort(function (left, right) {
      return moment.utc(right.searchedAt).diff(moment.utc(left.searchedAt))
    });
    return (
      <div key={key}>
        <span style={{ marginLeft: '37%', fontSize: '20px' }}>{moment(key).format('DD-MMM-YYYY')}</span>
        {values.map(o => {
          return (
            <React.Fragment>
              <pre key={new Date(o.searchedAt).toISOString()} className="serachRows" onClick={() => this.calculateInterestSearchClick(o)}>
                <span>Time :- {moment(o.searchedAt).format('HH:mm:ss')}</span>
                <span>Amount - {o.amountValue}</span>
                <span>Months - {o.monthsValue}</span>
              </pre>
              <hr />
            </React.Fragment>
          )
        })}
      </div>
    )
  }
  render() {
    const { response, amountValue, monthsValue, searchHistory = [] } = this.state;
    const groupedSearchData = this.groupSearchHistoryByDate(searchHistory);
    return (
      <div className="App">
        <header className="App-header">
          <span style={{ padding: '10px' }}>Interest Calculator</span>
        </header>
        <div className="row" style={{ marginTop: '2%' }}>
          <div className="col-md-4">
            <div>Search History</div>
            {Object.keys(groupedSearchData).length > 0 &&
              <div>
                {Object.keys(groupedSearchData).map(o => {
                  return this.renderHistory(o, groupedSearchData);
                })
                }
              </div>
            }
          </div>
          <div className="col-md-8 form-body">
            <div className="amountSlider">
              <span className="label">Amount (in USD)</span>
              <input type="number" value={amountValue} onChange={this.handleAmountChangeInput} />
              <div className="amountPicker">
                <InputRange
                  maxValue={5000}
                  minValue={500}
                  formatLabel={value => `${value} USD`}
                  value={amountValue}
                  onChange={this.handleAmountChangeSlider}
                  onChangeComplete={this.calculateInterest} />
              </div>
            </div>
            <div className="amountSlider" style={{ marginTop: '50px' }}>
              <span className="label">Duration (in months)</span>
              <input type="number" value={monthsValue} onChange={this.handleMonthChangeInput} />
              <div className="amountPicker">
                <InputRange
                  maxValue={24}
                  minValue={6}
                  formatLabel={value => `${value} months`}
                  value={monthsValue}
                  onChange={this.handleMonthChangeSlider}
                  onChangeComplete={this.calculateInterest} />
              </div>
            </div>
            <hr />
            {response && <div className="row">
              <div className="col-md-7">
                <div><span>Interest Rate :- </span> <span>{response.interestRate}</span></div>
                <div><span>EMI Monthly :- </span> <span>{response.monthlyPayment.amount}</span></div>
                <div><span>Total Principal :- </span> <span>{amountValue * monthsValue}</span></div>
                <div><span>Total Interest :- </span> <span>{response.monthlyPayment.amount * response.numPayments}</span></div>
                <div><span>Total Amount Payable :- </span> <span>{(response.monthlyPayment.amount * response.numPayments) + (amountValue * monthsValue)}</span></div>
              </div>
              <div className="col-md-5">
                <PieChart
                  data={[
                    { title: 'Principal', value: (amountValue * monthsValue), color: '#E38627' },
                    { title: 'Interest', value: (response.monthlyPayment.amount * response.numPayments), color: '#C13C37' },
                  ]}
                  label={({ data, dataIndex }) => `${data[dataIndex].title} - ${Math.round(data[dataIndex].percentage)}%`}
                  labelPosition={50}
                  labelStyle={{
                    fill: '#121212',
                    fontFamily: 'sans-serif',
                    fontSize: '5px'
                  }}
                />
              </div>
            </div>}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
