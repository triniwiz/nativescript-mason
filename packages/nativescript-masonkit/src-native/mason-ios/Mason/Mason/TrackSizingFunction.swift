//
//  TrackSizingFunction.swift
//  Mason
//
//  Created by Osei Fortune on 01/01/2023.
//

import Foundation

public enum TrackSizingFunction {
    case Single(MinMax)
    case AutoRepeat(GridTrackRepetition, Array<MinMax>)
}
