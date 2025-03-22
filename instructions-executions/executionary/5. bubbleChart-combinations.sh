#####     5. BUBBLE CHART COMBINATIONS     #####

#   - This script is invoked through "5. combinatorial-automations.sh" and
#     has the responsibility of managing the executionary combinations
#     that have an impact on bubble charts


CONFIG_FILE="../../configuration.yml"
source ./"5. utils.sh"

NO_COLOR='\033[0m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'


# Function:
#   - Runs the specified bubble chart combinations
#
# Arguments:
#   - ARG 1: String     -->     The value of 'separateGraphDisplay' in the central file 'configuration.yml'.
#                               If this is set to 'True', then 'Ncities' number of bubble charts are
#                               generated, such that each chart clearly shows a specific city's temperature
#   - ARG 2: String     -->     The value of 'bubbleColorTheme' in the file 'configuration.yml'
#
runBubbleCombinations() {
    SEPARATE_GRAPH_DISPLAY=${1}
    COLOR_THEME=${2}

    # Display merged graph (contains ALL city-instances) with all color theme combinations
    if [ "${SEPARATE_GRAPH_DISPLAY}" == "False" ]; then

        declare -a COLORS=("green" "purple" "yellow" "blue" "red" "orange" "gray" "aqua" "pink" "brown")
        COLORS_ARR_ARG=$(echo "${COLORS[@]}" | tr " " ",")

        # runAllCombinations "../../configuration.yml" "Europe" "${CONTINENTS}" "continent" "equatorChart=True"
        runUtilsCombinations "${CONFIG_FILE}" "${COLOR_THEME}" "${COLORS_ARR_ARG}" "colorTheme" -b


    
    # Display ALL separate graphs. Since there is only one value that allows/denies
    # this combination, we just run the system according to the developer's provided
    # settings in 'configuration.yml'. In other words, if 'separateGraphDisplay' is
    # set to 'True', we enter this code-snippet and run on thse settings, without having
    # to manipulate the .yml file during runtime
    else
        ./"4. data-visualization.sh" -b
    fi
}