let express = require('express')
let axios = require('axios')
let router = express.Router()
const dbMS = require('../helpers/dbMS')
let moment = require('moment')
router.get('/getAccess/', async function (req, res, next) {
  try {
    let result = await dbMS.q(`SELECT TOP (@limit) PRD FROM TestUp.spline.OpCard where CARD = @card`, { 'limit': 1, 'card': req.query.card })
    let PRD = result[0].PRD
    return res.json({
      status: 1,
      data: {
        access: parseInt(PRD) === 1 ? 1 : 0
      }
    })
  } catch (error) {
    console.log(error)
    res.json({
      status: 0,
      message: 'Не удалось найти пользователя'
    })
  }
})
router.get('/siz/', async function (req, res, next) {
  try {
    let url
    let result = await dbMS.q(`SELECT TOP (@limit) TABN FROM TestUp.spline.OpCard where CARD = @card`, { 'limit': 1, 'card': req.query.card })
    let tabn = result[0].TABN
    url = `https://elem-pre.elem.ru/spline/TestSpOde`
    let jsonResult = await axios.post(url, {
      TABN: '110' + tabn,
      opr: 'SETSPOD'
    })
    let html = `
        <table class="tableBorder" border=1 style="background-color: #f7cb70;">
            <tr id="tbr_spnpol"><th id="WGBEZ">Наименование<br>спецсредств</th><th id="QUOM">Ед.<br>изм.</th><th id="QUOTA">Кол-во<br>на год</th><th id="AQUANT">Кол-во<br>на складе</th></tr>
            ${jsonResult.data.spnpol}
        </table><br /><table border=1 class="tableBorder" style="background-color: #f7cb70;">
            <tr id="tbr_sppol"><th id="DESCRIPT">Наименование<br>спецсредств</th><th id="AUOM">Ед.<br>изм.</th><th id="AQUANT">Кол-<br>во</th><th id="AKTIV">Дата<br>получ.</th><th id="DEAKTIV">Дата<br>очередн.<br>получ.</th><th id="PERCENTWEAR">%<br>износ</th></tr>
            ${jsonResult.data.sppol}
        </table><style>.tableBorder {font-size: 10pt;width: 100%;border-collapse: collapse;}.tableBorder td, .tableBorder th{padding: 3px 5px;}</style>`
    return res.send(html)
  } catch (error) {
    console.log(error)
    res.json({
      status: 0,
      message: 'Не удалось получить информацию по контролю доступа'
    })
  }
})
router.get('/control/', async function (req, res, next) {
  try {
    let result = await dbMS.q(`SELECT TOP (@limit) TABN FROM TestUp.spline.OpCard where CARD = @card`, { 'limit': 1, 'card': req.query.card })
    let tabn = result[0].TABN
    let currentDate = new Date()
    let htmlResult = await axios.get(`https://elem-pre.elem.ru/spline/crutch-master?tabn=${tabn}&month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`)
    res.json({
      status: 1,
      data: htmlResult.data || ''
    })
  } catch (error) {
    console.log(error)
    res.json({
      status: 0,
      message: 'Не удалось получить информацию по контролю доступа'
    })
  }
})
router.get('/kvitok/', async function (req, res, next) {
  try {
    let result = await dbMS.q(`SELECT TOP (@limit) TABN FROM TestUp.spline.OpCard where CARD = @card`, { 'limit': 1, 'card': req.query.card })
    let tabn = result[0].TABN
    let jsonResult = await axios.get('https://elem-pre.elem.ru/spline/api/salary?tabn=' + tabn)
    if (!jsonResult.status) {

    }
    let a = jsonResult.data.data[0].accruals_per_month.data
    let b = jsonResult.data.data[0].retentions_per_month.data

    jsonResult.data.data[0].combineResult = []
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (
        (a[i] && a[i][0].value) ||
        (a[i] && a[i][1].value) ||
        (a[i] && a[i][2].value) ||
        (a[i] && a[i][3].value) ||
        (b[i] && b[i][0].value) ||
        (b[i] && b[i][1].value) ||
        (b[i] && b[i][2].value) ||
        (b[i] && b[i][3].value)
      ) {
        jsonResult.data.data[0].combineResult.push([
          a[i] || [[], [], [], []], b[i] || [[], [], [], []]
        ])
      }
    }

    res.json({
      status: 1,
      data: jsonResult.data || []
    })
  } catch (error) {
    console.log(error)
    res.json({
      status: 0,
      message: 'Не удалось получить расчётный листок'
    })
  }
})
router.get('/kvitokPrint/', async function (req, res, next) {
  try {
    let result = await dbMS.q(`SELECT TOP (@limit) TABN FROM TestUp.spline.OpCard where CARD = @card`, { 'limit': 1, 'card': req.query.card })
    let tabn = result[0].TABN
    let jsonResult = await axios.get('https://elem-pre.elem.ru/spline/api/salary?tabn=' + tabn)
    jsonResult = jsonResult.data
    let html = '<div style="font-size: 10px;font-family: arial;margin: 5px;">'
    let widthStyle = 'width: 97%'
    html += kvitokHead(jsonResult, tabn) + '<br />'
    html += kvitokIncome(jsonResult, widthStyle) + '<br />'
    html += kvitokOutcome(jsonResult, true, widthStyle) + '<br />'
    html += kvitokSum(jsonResult, widthStyle) + '<br />'
    html += kvitokinsurance(jsonResult, widthStyle)
    html += '</div>'

    return res.send(html)
  } catch (error) {
    console.log(error)
    res.json({
      status: 0,
      message: 'Не удалось получить информацию по обучению'
    })
  }
})
router.get('/eda/', async function (req, res, next) {
  try {
    let result = await dbMS.q(`SELECT TOP (@limit) TABN FROM TestUp.spline.OpCard where CARD = @card`, {
      'limit': 1,
      'card': req.query.card
    })
    let tabn = result[0].TABN

    let url = `https://elem-pre.elem.ru/spline/api/vouchers?tabn=${tabn}`
    let resp = await axios.get(url)
    res.json({
      status: 1,
      data: resp.data.data
    })
  } catch (e) {
    console.warn(e)
    return res.json({
      status: 'error',
      data: {
        message: 'Не удалось обработать запрос, попробуйте позже'
      }
    })
  }
})
router.get('/vocation/', async function (req, res, next) {

  try {
    let result = await dbMS.q(`SELECT TOP (@limit) TABN FROM TestUp.spline.OpCard where CARD = @card`, {
      'limit': 1,
      'card': req.query.card
    })
    let tabn = result[0].TABN

    let url = `https://elem-pre.elem.ru/spline/Test?tabn=${tabn}`
    let resp = await axios.get(url)

    let currentDate = new Date()

    result = {
      planned_dates: [],
      debt: 0
    }

    for (let index in resp.data.data.planned_dates) {
      if (resp.data.data.planned_dates[index].year > currentDate.getFullYear() ||
        (
          resp.data.data.planned_dates[index].year == currentDate.getFullYear() &&
          resp.data.data.planned_dates[index].month >= currentDate.getMonth()
        )) {
        result.planned_dates.push({
          date: moment([resp.data.data.planned_dates[index].year, resp.data.data.planned_dates[index].month - 1]).locale('ru').format('MMMM YYYY'),
          number_of_days: resp.data.data.planned_dates[index].number_of_days
        })
      }
    }

    result.debt += resp.data.data.debt.debt_last_period
    result.debt += resp.data.data.debt.current_period_debt
    result.debt += resp.data.data.debt.addidtion_days

    res.json({ status: 'OK', data: result })
  } catch (e) {
    console.warn(e)
    return res.json({
      status: 'error',
      data: {
        message: 'Не удалось обработать запрос, попробуйте позже'
      }
    })
  }
})
router.get('/education/', async function (req, res, next) {
  try {
    let result = await dbMS.q(`SELECT TOP (@limit) TABN FROM TestUp.spline.OpCard where CARD = @card`, { 'limit': 1, 'card': req.query.card })
    let tabn = result[0].TABN
    let jsonResult = await axios.get('https://elem-pre.elem.ru/spline/api/education?tabn=' + tabn)
    res.json({
      status: 1,
      data: jsonResult.data || []
    })
  } catch (error) {
    console.log(error)
    res.json({
      status: 0,
      message: 'Не удалось получить информацию по обучению'
    })
  }
})

function kvitokHead (jsonResult, tabn) {
  return `
      <div>${jsonResult.data[0].company.code}. ${jsonResult.data[0].company.name}</div>
      <div><b>Расчётный листок за ${moment([jsonResult.year, jsonResult.month - 1]).locale('ru').format('MMMM YYYY')}</b></div>
      <div>Цех(отдел): ${jsonResult.data[0].department.code}. ${jsonResult.data[0].department.name}</div>
      <div>Таб.N <b>${tabn}</b> &nbsp; ФИО: <b>${jsonResult.data[0].employee.fullname}</b></div>
      <div>${jsonResult.data[0].rate.wage_slip_name}:${jsonResult.data[0].rate.value}</div>
      <div>${jsonResult.data[0].working_time_fund_plan.name}:${jsonResult.data[0].working_time_fund_plan.value}</div>
    `
}
function kvitokIncome (jsonResult, widthStyle) {
  let result = `<table style="font-size: 10px;border-collapse:collapse; ${widthStyle}" border="1" cellspacing="0" cellpadding="2">
        <tbody>
            <tr align="center">
                <td colspan="4"><b>${jsonResult.data[0].accruals_per_month.name}</b></td>
            </tr>
            <tr align="center">
                <td>${jsonResult.data[0].accruals_per_month.data[0][0].name}</td>
                <td>${jsonResult.data[0].accruals_per_month.data[0][1].name}</td>
                <td>${jsonResult.data[0].accruals_per_month.data[0][2].name}</td>
                <td>${jsonResult.data[0].accruals_per_month.data[0][3].name}</td>
            </tr>`

  for (let i in jsonResult.data[0].accruals_per_month.data) {
    if (!jsonResult.data[0].accruals_per_month.data[i][2].value) continue
    result += `<tr align="right">
                  <td>${jsonResult.data[0].accruals_per_month.data[i][0].value}</td>
                  <td align="left">${jsonResult.data[0].accruals_per_month.data[i][1].value}</td>
                  <td>${jsonResult.data[0].accruals_per_month.data[i][2].value}</td>
                  <td>${jsonResult.data[0].accruals_per_month.data[i][3].value}</td>
               </tr>`
  }
  result += `<tr align="right">
                <td colspan="2" align="center"><b>${jsonResult.data[0].accruals_per_month.total_accrued.wage_slip_name}</b></td>
                <td colspan="2" align="center"><b>${jsonResult.data[0].accruals_per_month.total_accrued.value}</b></td></td>
             </tr>`

  if (jsonResult.data[0].other.length) {
    result += `<tr align="right">
                <td colspan="4" align="center"><b>Доходы в неденежн.форме,вычеты:</b></td>
             </tr>`
    for (let i in jsonResult.data[0].other) {
      result += `<tr align="right">
      <td>${jsonResult.data[0].other[i].сode}</td>
      <td>${jsonResult.data[0].other[i].name}</td>
      <td>${jsonResult.data[0].other[i].value}</td>
      <td></td>
    </tr>`
    }
  }
  result += `</tbody></table>`
  return result
}
function kvitokOutcome (jsonResult, showresult, widthStyle) {
  let result = `<table  style="font-size: 10px;border-collapse:collapse; ${widthStyle}" border="1" cellspacing="0" cellpadding="2" width="100%">
        <tbody>
            <tr align="center">
                <td colspan="4"><b>${jsonResult.data[0].retentions_per_month.wage_slip_name}</b></td>
            </tr>
            <tr align="center">
                <td>${jsonResult.data[0].retentions_per_month.data[0][0].name}</td>
                <td>${jsonResult.data[0].retentions_per_month.data[0][1].name}</td>
                <td>${jsonResult.data[0].retentions_per_month.data[0][2].name}</td>
                <td>${jsonResult.data[0].retentions_per_month.data[0][3].name}</td>
            </tr>`

  for (let i in jsonResult.data[0].retentions_per_month.data) {
    if (!jsonResult.data[0].accruals_per_month.data[i][2].value) continue
    result += `<tr align="right">
                  <td>${jsonResult.data[0].retentions_per_month.data[i][0].value}</td>
                  <td align="left">${jsonResult.data[0].retentions_per_month.data[i][1].value}</td>
                  <td>${jsonResult.data[0].retentions_per_month.data[i][2].value}</td>
                  <td>${jsonResult.data[0].retentions_per_month.data[i][3].value}</td>
               </tr>`
  }

  result += `<tr align="right">
                  <td colspan="2" align="center"><b>${jsonResult.data[0].retentions_per_month.total_retentions.wage_slip_name}</b></td>
                  <td colspan="2" align="center"><b>${jsonResult.data[0].retentions_per_month.total_retentions.value}</b></td>
               </tr>`
  if (showresult) {
    result += `<tr align="right">
      <td colspan="4" align="center"><b>${jsonResult.data[0].payroll.wage_slip_name}: ${jsonResult.data[0].payroll.value}</b></td>
    </tr>`
  }
  result += `</tbody></table>`
  return result
}
function kvitokSum (jsonResult,widthStyle) {
  return `<table style="font-size: 10px;border-collapse:collapse; ${widthStyle}" border="1" cellspacing="0" cellpadding="2" width="100%">
        <tbody>
            <tr align="center">
               <td><b>${jsonResult.data[0].taxes[0][0].name}</b></td>
               <td><b>${jsonResult.data[0].taxes[0][1].name}</b></td>
            </tr>
            <tr align="right">
               <td>${jsonResult.data[0].taxes[0][0].value}</td>
               <td>${jsonResult.data[0].taxes[0][1].value}</td>
            </tr>
    </tbody></table>`
}
function kvitokinsurance (jsonResult, widthStyle) {
  return `<table border="1" style="font-size: 10px;border-collapse:collapse; ${widthStyle}" cellspacing="0" cellpadding="2" width="100%">
        <tbody>
            <tr align="center">
               <td colspan="4"><b>${jsonResult.data[0].insurance_premiums.wage_slip_name}</b></td>
            </tr>
            <tr align="right">
               <td>${jsonResult.data[0].insurance_premiums.data[0].name}</td>
               <td>${jsonResult.data[0].insurance_premiums.data[1].name}</td>
               <td>${jsonResult.data[0].insurance_premiums.data[2].name}</td>
               <td>${jsonResult.data[0].insurance_premiums.data[3].name}</td>
            </tr>
            <tr align="right">
               <td>${jsonResult.data[0].insurance_premiums.data[0].value}</td>
               <td>${jsonResult.data[0].insurance_premiums.data[1].value}</td>
               <td>${jsonResult.data[0].insurance_premiums.data[2].value}</td>
               <td>${jsonResult.data[0].insurance_premiums.data[3].value}</td>
            </tr>
    </tbody></table>`
}

module.exports = router
