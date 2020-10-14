import axios from 'axios';
import cheerio from 'cheerio';
import { unique } from '../utils';
import { DELIVERY_MODES } from '../constants';

class Section {
  constructor(oscar, course, sectionId, data) {
    const [
      crn,
      meetings,
      credits,
      scheduleTypeIndex,
      campusIndex,
      attributeIndices,
      gradeBasisIndex
    ] = data;

    this.course = course;
    this.id = sectionId;
    this.crn = crn;
    this.seating = [[], 0];
    this.credits = credits;
    this.scheduleType = oscar.scheduleTypes[scheduleTypeIndex];
    this.campus = oscar.campuses[campusIndex];

    const attributes = attributeIndices.map(
      (attributeIndex) => oscar.attributes[attributeIndex]
    );
    this.deliveryMode = attributes.find(
      (attribute) => attribute in DELIVERY_MODES
    );

    this.gradeBasis = oscar.gradeBases[gradeBasisIndex];
    this.meetings = meetings.map(
      ([periodIndex, days, where, instructors, dateRangeIndex]) => ({
        period: oscar.periods[periodIndex],
        days: days === '&nbsp;' ? [] : [...days],
        where,
        instructors: instructors.map((instructor) =>
          instructor.replace(/ \(P\)$/, '')
        ),
        dateRange: oscar.dateRanges[dateRangeIndex]
      })
    );
    this.instructors = unique(
      this.meetings.reduce(
        (instructors, meeting) => [...instructors, ...meeting.instructors],
        []
      )
    );
  }

  async fetchSeating(term) {
    const prevDate = this.seating[1];
    const currDate = Date.now();

    if (currDate - prevDate > 300000) {
      const url = `https://oscar.gatech.edu/pls/bprod/`
        + `bwckschd.p_disp_detail_sched?term_in=${term}`
        + `&crn_in=${this.crn}`;

      return await axios({
        url: `https://cors-anywhere.herokuapp.com/${url}`,
        method: 'get',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'text/html'
        }
      })
        .then(response => {
          const $ = cheerio.load(response.data);
          const availabilityTable = $('.datadisplaytable .datadisplaytable');
          const tableRow = availabilityTable.find("tr");

          this.seating = [[
            parseInt(tableRow.eq(1).children("td").first().text(), 10),
            parseInt(tableRow.eq(1).children("td").eq(1).text(), 10),
            parseInt(tableRow.eq(2).children("td").first().text(), 10),
            parseInt(tableRow.eq(2).children("td").eq(1).text(), 10)
          ], currDate]

          return this.seating;
        })
        .catch(() => [new Array(4).fill("N/A"), currDate]);
    } else {
      return this.seating;
    }
  }
}

export default Section;
