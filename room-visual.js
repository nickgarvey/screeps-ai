"use strict";

module.exports = {
    /**
     *  @param {Room} room
     *  @param {Array<Array<number>>} values
     */
    heatMap: (room, values) => {
        const min = _.min(_.flatten(values));
        const max = _.max(_.flatten(values));
        const normalized = _(values)
            .map(row => _(row)
                .map(v => v - min)  // negative numbers -> 0
                .map(v => v/max)  // all numbers to [0, 1]
            );

        const pad = (numStr) => numStr.length === 1 ? "0" + numStr : numStr;

        const normalToHex = (n) => "#"
            + pad(Math.round(255 * n).toString(16))
            + pad(Math.round(255 * (1 - n)).toString(16))
            + "00";

        const colors = _(normalized)
            .map(row => _(row)
                .map(normalToHex).value()
            )
            .value();

        for (let i = 0; i < values.length; i++) {
            for (let j = 0; j < values[i].length; j++) {

                const text = (
                    Number.isInteger(values[i][j])
                    ? values[i][j]
                    : values[i][j].toFixed(1)
                ).toString();
                const style = {
                    backgroundColor: colors[i][j],
                    opacity: .2,
                    font: 0.4,
                    backgroundPadding: 0.13,
                };

                room.visual.text(text, i, j, style);
            }
        }
    }
};
