#####     5. PIE CHART COMBINATIONS     #####

#   - This script is invoked through "5. combinatorial-automations.sh" and
#     has the responsibility of managing the executionary combinations
#     that have an impact on pie charts



CONFIG_FILE="../../configuration.yml"
source ./"5. utils.sh"

NO_COLOR='\033[0m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'



# Only 1 combination for this
# Since the codeflow only enters this function on the premise that 'chartType' = 'Random-Colors' so
# that the changes are already configured by the developer, the only thing that needs to be done
# is to visualize it. A note for prospective developers who want to pipe all pie-charts together
# in one command is to follwo the code practice in the above functions, where the inital value is
# stored as a key-value to replace with the desired initial value, and then chain the changes
# through CLI together in one shell command
runRandomColorCombination() {
    ./"4. data-visualization.sh" -p
}


# As the function above --> Only one possible combination, and the codeflow denies the entry of this
# function unless the developer wants to try all combinations of this 'chartType'
runFourColdestCitiesCombination() {
    ./"4. data-visualization.sh" -p
}



# Function:
#   - Runs the specified pie chart combinations
#
# Arguments:
#   - ARG 1: String     -->     The value of 'chartType' that governs the type of pie chart to display.
#                               Possible values for this argument are ['Random-Colors',
#                               '4-Coldest-Cities', 'Color-Theme']
#   - ARG 2: String     -->     The value of 'pieColorTheme' in the file 'configuration.yml'
#
runPieCombinations() {
    CHART_TYPE=${1}
    COLOR_THEME=${2}

    if [ "${CHART_TYPE}" == "Color-Theme" ]; then

        declare -a COLORS=("green" "purple" "yellow" "blue" "red" "orange" "gray" "aqua" "pink" "brown")
        COLORS_ARR_ARG=$(echo "${COLORS[@]}" | tr " " ",")

        runUtilsCombinations "${CONFIG_FILE}" "${COLOR_THEME}" "${COLORS_ARR_ARG}" "colorTheme" -p

    elif [ "${CHART_TYPE}" == "4-Coldest-Cities" ]; then
        runFourColdestCitiesCombination
    else
        runRandomColorCombination
    fi
}