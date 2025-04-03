import sys

#sys.path.append('..')
#import charts.bubbleChart as bubbleChart

# import bubbleChart    # TEMPORARY COMMENTED OUT
# import pieChart       # TEMPORARY COMMENTED OUT
import equatorChart


# ARGUMENTS:
#   Argument 1: visualizeBubbleChart        = ['True' or 'False']
#   Argument 2: visualizePieChart           = ['True' or 'False']
#   Argument 3: visualizeEquatorChart       = ['True' or 'False']


numExpectedArguments = 4 # The 0th argument is the path to this script
numInputArguments = len(sys.argv)


def visualizeBubbleCharts():
    # bubbleChart.plotBubbleChart()
    print("TEMPORARY COMMENTED OUT")

def visualizePieCharts():
    # pieChart.plotPieChart()
    print("TEMPORARY COMMENTED OUT")

def visualizeEquatorChart():
    return equatorChart.plotEquatorChart()


def main():
    figure_json = None

    # If the developer by mistake inputs the wrong number of arguments,
    # then default to plotting all charts and printing a warning
    if numInputArguments != numExpectedArguments:
        print("Warning: No more or less than 3-boolean arguments are expected to run '/charts/main.py'")

        visualizeBubbleCharts()
        visualizePieCharts()
        figure_json = visualizeEquatorChart()

    # Only visualize the specified charts, that the developer specified through the passed arguments in the execution of this file
    else:
        chartVisualizationFunctions = [visualizeBubbleCharts, visualizePieCharts, visualizeEquatorChart]

        # Iterate over all passed arguments
        for i in range(1, numInputArguments):
            currentArg = sys.argv[i]

            # If the current element, at the i:th position is true, then call the corresponding function to visualize the specified chart
            if currentArg == 'True':
                result = chartVisualizationFunctions[i - 1]()
                if i == 3:  # This is the equator chart
                    figure_json = result

    return figure_json

if __name__ == "__main__":
    figure_json = main()
    if figure_json:
        print("FIGURE_JSON_START")
        print(figure_json)
        print("FIGURE_JSON_END")